(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@depay/web3-constants'), require('@depay/web3-client'), require('@depay/web3-blockchains'), require('@depay/web3-tokens')) :
  typeof define === 'function' && define.amd ? define(['exports', '@depay/web3-constants', '@depay/web3-client', '@depay/web3-blockchains', '@depay/web3-tokens'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Web3Assets = {}, global.Web3Constants, global.Web3Client, global.Web3Blockchains, global.Web3Tokens));
}(this, (function (exports, web3Constants, web3Client, web3Blockchains, web3Tokens) { 'use strict';

  const ensureNativeTokenAsset = async ({ address, assets, blockchain }) => {
    if(assets.find((asset)=> {
      return asset.address.toLowerCase() == web3Constants.CONSTANTS[blockchain].NATIVE.toLowerCase()
    }) == undefined) {
      let balance = await web3Client.request(
        {
          blockchain: blockchain,
          address,
          method: 'balance',
        },
        { cache: 30000 }
      );
      assets = [{
        name: web3Constants.CONSTANTS[blockchain].CURRENCY,
        symbol: web3Constants.CONSTANTS[blockchain].SYMBOL,
        address: web3Constants.CONSTANTS[blockchain].NATIVE,
        type: 'NATIVE',
        blockchain,
        balance: balance.toString()
      }, ...assets];
    }
    return assets
  };

  var getAssets = async (options) => {
    if(options === undefined) { options = { accounts: {} }; }

    let assets = Promise.all(
      (Object.keys(options.accounts)).map((blockchain) =>{

        const address = options.accounts[blockchain];
        
        return fetch(`https://public.depay.fi/accounts/${blockchain}/${address}/assets`)
          .catch((error) => { console.log(error); })
          .then((response) => response.json())
          .then(async (assets) => {
            return await ensureNativeTokenAsset({
              address,
              assets: assets.map((asset) => Object.assign(asset, { blockchain })),
              blockchain
            })
          }).catch((error) => { console.log(error); })
      }),
    ).then((responses) => responses.flat());

    return assets
  };

  const reduceAssetWithBalance = (asset, balance)=>{
    return Object.assign({}, {
      address: asset.address,
      symbol: asset.symbol,
      name: asset.name,
      decimals: asset.decimals,
      type: asset.type,
      blockchain: asset.blockchain
    }, { balance: balance.toString() })
  };

  var dripAssets = async (options) => {
    if(options === undefined) { options = { accounts: {}, priority: [] }; }

    let assets = [];

    // Prioritized Assets
    
    await Promise.all((options.priority || []).map((asset)=>{
      return new Promise(async (resolve, reject)=>{
        let token = new web3Tokens.Token(asset);
        let completedAsset = Object.assign({},
          asset,
          {
            name: await token.name(),
            symbol: await token.symbol(),
            decimals: await token.decimals(),
            balance: (await token.balance(options.accounts[asset.blockchain])).toString()
          }
        );
        assets.push(completedAsset);
        if(typeof options.drip == 'function') { options.drip(completedAsset); }
        resolve(completedAsset);
      })
    }));
    
    // Major Tokens
    
    let majorTokens = [];
    for (var blockchain in options.accounts){
      web3Blockchains.Blockchain.findByName(blockchain).tokens.forEach((token)=>{
        majorTokens.push(Object.assign({}, token, { blockchain }));
      });
    }
    await Promise.all(majorTokens.map((asset)=>{
      return new Promise((resolve, reject)=>{
        if(assets.find(element => element.blockchain == asset.blockchain && element.address.toLowerCase() == asset.address.toLowerCase())) {
          return resolve() // already part of assets
        }
        new web3Tokens.Token(asset).balance(options.accounts[asset.blockchain])
          .then((balance)=>{
            const assetWithBalance = reduceAssetWithBalance(asset, balance);
            assets.push(assetWithBalance);
            if(typeof options.drip == 'function') { options.drip(assetWithBalance); }
            resolve(assetWithBalance);
          }).catch((error)=>{ console.log(error); });
      })
    }));

    // All other assets

    let allAssets = await getAssets(options);
    await Promise.all(allAssets.map((asset)=>{
      return new Promise((resolve, reject)=>{
        if(assets.find(element => element.blockchain == asset.blockchain && element.address.toLowerCase() == asset.address.toLowerCase())) {
          resolve(); // already part of assets
        } else {
          return new web3Tokens.Token(asset).balance(options.accounts[asset.blockchain]).then((balance)=>{
            const assetWithBalance = reduceAssetWithBalance(asset, balance);
            assets.push(assetWithBalance);
            if(typeof options.drip == 'function') { options.drip(assetWithBalance); }
            resolve(assetWithBalance);
          })
        }
      })
    }));

    return assets
  };

  exports.dripAssets = dripAssets;
  exports.getAssets = getAssets;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
