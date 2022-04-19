import { CONSTANTS } from '@depay/web3-constants';
import { request } from '@depay/web3-client';
import { Blockchain } from '@depay/web3-blockchains';
import { Token } from '@depay/web3-tokens';

const ensureNativeTokenAsset = async ({ address, options, assets, blockchain }) => {
  if(options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>(only.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()))){ return assets }
  if(options.exclude && options.exclude[blockchain] && !!options.exclude[blockchain].find((exclude)=>(exclude.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()))){ return assets }

  const nativeTokenMissing = !assets.find((asset)=>(asset.address.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()));
  if(nativeTokenMissing) {
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

const filterAssets = ({ assets, blockchain, options })=>{
  if(options.only) {
    return assets.filter((asset)=>{
      return (options.only[blockchain] || []).find((onlyAsset)=>(onlyAsset.toLowerCase() == asset.address.toLowerCase()))
    })
  } else if(options.exclude) {
    return assets.filter((asset)=>{
      return (options.exclude[blockchain] || []).find((excludeAsset)=>(excludeAsset.toLowerCase() != asset.address.toLowerCase()))
    })
  } else {
    return assets
  }
};

var getAssets = async (options) => {
  if(options === undefined) { options = { accounts: {} }; }

  let assets = Promise.all(
    (Object.keys(options.accounts)).map((blockchain) =>{

      return new Promise((resolve, reject)=>{
        const address = options.accounts[blockchain];
        const controller = new AbortController();
        setTimeout(()=>controller.abort(), 10000);
        fetch(`https://public.depay.fi/accounts/${blockchain}/${address}/assets`, { signal: controller.signal })
          .catch((error) => { console.log(error); resolve([]); })
          .then((response) => {
            if(response && response.ok) {
              return response.json()
            } else {
              resolve([]);
            }
          })
          .then(async (assets) => {
            if(assets && assets.length) {
              return await ensureNativeTokenAsset({
                address,
                options,
                assets: filterAssets({ assets, blockchain, options }).map((asset) => Object.assign(asset, { blockchain })),
                blockchain
              })
            } else {
              resolve([]);
            }
          })
          .then(resolve)
          .catch((error) => { console.log(error); resolve([]); });
      })
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

const exists = ({ assets, asset })=> {
  return !!assets.find(element => element.blockchain == asset.blockchain && element.address.toLowerCase() == asset.address.toLowerCase())
};

const isFiltered = ({ options, address, blockchain })=> {
  if(options && options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>only.toLowerCase()==address.toLowerCase())){ 
    return true 
  }
  if(options && options.exclude && options.exclude[blockchain] && options.exclude[blockchain].find((only)=>only.toLowerCase()==address.toLowerCase())){
    return true 
  }
  return false
};

var dripAssets = async (options) => {
  if(options === undefined) { options = { accounts: {}, priority: [] }; }

  let assets = [];
  let promises = [];

  // Prioritized Assets
  
  promises = promises.concat((options.priority || []).map((asset)=>{
    return new Promise(async (resolve, reject)=>{
      try {
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
        if(completedAsset.balance != '0') {
          if(exists({ assets, asset })) { return resolve() }
          assets.push(completedAsset);
          if(typeof options.drip == 'function') { options.drip(completedAsset); }
          resolve(completedAsset);
        } else {
          resolve();
        }
      } catch (e) {
        resolve();
      }
    })
  }));
  
  // Major Tokens
  
  let majorTokens = [];
  for (var blockchain in options.accounts){
    Blockchain.findByName(blockchain).tokens.forEach((token)=>{
      if(isFiltered({ options, address: token.address, blockchain })){ return }
      majorTokens.push(Object.assign({}, token, { blockchain }));
    });
  }
  promises = promises.concat((majorTokens.map((asset)=>{
    return new Promise((resolve, reject)=>{
      new Token(asset).balance(options.accounts[asset.blockchain])
        .then((balance)=>{
          if(exists({ assets, asset })) { return resolve() }
          const assetWithBalance = reduceAssetWithBalance(asset, balance);
          if(assetWithBalance.balance != '0') {
            assets.push(assetWithBalance);
            if(typeof options.drip == 'function') { options.drip(assetWithBalance); }
            resolve(assetWithBalance);
          } else {
            resolve();
        }}).catch((error)=>{ console.log(error); resolve(); });
    })
  })));

  // All other assets

  if(options.only == undefined || Object.keys(options.only).every((list)=>list.length == 0)) {
    let allAssets = await getAssets(options);
    promises = promises.concat((allAssets.map((asset)=>{
      return new Promise((resolve, reject)=>{
        return new Token(asset).balance(options.accounts[asset.blockchain])
          .then((balance)=>{
            if(exists({ assets, asset })) { return resolve() }
            const assetWithBalance = reduceAssetWithBalance(asset, balance);
            if(assetWithBalance.balance != '0') {
              assets.push(assetWithBalance);
              if(typeof options.drip == 'function') { options.drip(assetWithBalance); }
              resolve(assetWithBalance);
            } else {
              resolve();
          }}).catch((error)=>{ console.log(error); resolve(); })
      })
    })));
  }

  await Promise.all(promises);

  return assets
};

export { dripAssets, getAssets };
