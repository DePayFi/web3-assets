import { CONSTANTS } from '@depay/web3-constants';
import { request } from '@depay/web3-client';
import { Blockchain } from '@depay/web3-blockchains';
import { Token } from '@depay/web3-tokens';

const ensureNativeTokenAsset = async ({ address, assets, blockchain }) => {
  if(assets.find((asset)=> {
    return asset.address.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()
  }) == undefined) {
    let balance = await request(
      {
        blockchain: blockchain,
        address,
        method: 'balance',
      },
      { cache: 30000 }
    );
    assets = [{
      name: CONSTANTS[blockchain].CURRENCY,
      symbol: CONSTANTS[blockchain].SYMBOL,
      address: CONSTANTS[blockchain].NATIVE,
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
      let token = new Token(asset);
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
    Blockchain.findByName(blockchain).tokens.forEach((token)=>{
      majorTokens.push(Object.assign({}, token, { blockchain }));
    });
  }
  await Promise.all(majorTokens.map((asset)=>{
    return new Promise((resolve, reject)=>{
      if(assets.find(element => element.blockchain == asset.blockchain && element.address.toLowerCase() == asset.address.toLowerCase())) {
        return resolve() // already part of assets
      }
      new Token(asset).balance(options.accounts[asset.blockchain])
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
        return new Token(asset).balance(options.accounts[asset.blockchain]).then((balance)=>{
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

export { dripAssets, getAssets };
