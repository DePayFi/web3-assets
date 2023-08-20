import { request } from '@depay/web3-client-solana';
import Blockchains from '@depay/web3-blockchains';
import Token from '@depay/web3-tokens-solana';

const ensureNativeTokenAsset = async ({ address, options, assets, blockchain }) => {
  if(options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>(only.toLowerCase() == Blockchains[blockchain].currency.address.toLowerCase()))){ return assets }
  if(options.exclude && options.exclude[blockchain] && !!options.exclude[blockchain].find((exclude)=>(exclude.toLowerCase() == Blockchains[blockchain].currency.address.toLowerCase()))){ return assets }

  const nativeTokenMissing = !assets.find((asset)=>(asset.address.toLowerCase() == Blockchains[blockchain].currency.address.toLowerCase()));
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
      name: Blockchains[blockchain].currency.name,
      symbol: Blockchains[blockchain].currency.symbol,
      address: Blockchains[blockchain].currency.address,
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
        fetch(`https://public.depay.com/accounts/${blockchain}/${address}/assets`, { signal: controller.signal })
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

function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

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

const sortPriorities = (priorities, a,b)=>{
  if(!priorities || priorities.length === 0) { return 0 }
  let priorityIndexOfA = priorities.indexOf([a.blockchain, a.address.toLowerCase()].join(''));
  let priorityIndexOfB = priorities.indexOf([b.blockchain, b.address.toLowerCase()].join(''));
  
  if(priorityIndexOfA !== -1 && priorityIndexOfB === -1) {
    return -1 // a wins
  }
  if(priorityIndexOfB !== -1 && priorityIndexOfA === -1) {
    return 1 // b wins
  }

  if(priorityIndexOfA < priorityIndexOfB) {
    return -1 // a wins
  }
  if(priorityIndexOfB < priorityIndexOfA) {
    return 1 // b wins
  }
  return 0
};

var dripAssets = async (options) => {
  if(options === undefined) { options = { accounts: {}, priority: [] }; }

  let assets = [];
  let dripped = [];
  let promises = [];
  let priorities = _optionalChain([options, 'optionalAccess', _ => _.priority, 'optionalAccess', _2 => _2.map, 'call', _3 => _3((priority)=>[priority.blockchain, priority.address.toLowerCase()].join(''))]);
  let drippedIndex = 0;
  let dripQueue = [];

  const drip = (asset, recursive = true)=>{
    if(typeof options.drip !== 'function') { return }
    const assetAsKey = [asset.blockchain, asset.address.toLowerCase()].join('');
    if(dripped.indexOf(assetAsKey) > -1) { return }
    if(priorities && priorities.length && priorities.indexOf(assetAsKey) === drippedIndex) {
      dripped.push(assetAsKey);
      options.drip(asset);
      drippedIndex += 1;
      if(!recursive){ return }
      dripQueue.forEach((asset)=>drip(asset, false));
    } else if(!priorities || priorities.length === 0 || drippedIndex >= priorities.length) {
      if(!priorities || priorities.length === 0 || priorities.indexOf(assetAsKey) === -1) {
        dripped.push(assetAsKey);
        options.drip(asset);
      } else if (drippedIndex >= priorities.length) {
        dripped.push(assetAsKey);
        options.drip(asset);
      }
    } else if(!dripQueue.find((queued)=>queued.blockchain === asset.blockchain && queued.address.toLowerCase() === asset.address.toLowerCase())) {
      dripQueue.push(asset);
      dripQueue.sort((a,b)=>sortPriorities(priorities, a, b));
    }
  };

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
            balance: (await token.balance(options.accounts[asset.blockchain])).toString(),
            type: Blockchains[asset.blockchain].currency.address.toLowerCase() === asset.address.toLowerCase() ? 'NATIVE' : '20'
          }
        );
        if(completedAsset.balance != '0') {
          if(exists({ assets, asset })) { return resolve() }
          assets.push(completedAsset);
          drip(completedAsset);
          resolve(completedAsset);
        } else {
          resolve();
        }
      } catch (e) {
        resolve();
      }
    })
  }));
  Promise.all(promises).then(()=>{
    drippedIndex = _optionalChain([priorities, 'optionalAccess', _4 => _4.length]) || 0;
    dripQueue.forEach((asset)=>drip(asset, false));
  });
  
  // Major Tokens
  
  let majorTokens = [];
  for (var blockchain in options.accounts){
    Blockchains.findByName(blockchain).tokens.forEach((token)=>{
      if(isFiltered({ options, address: token.address, blockchain })){ return }
      if(_optionalChain([options, 'optionalAccess', _5 => _5.priority, 'optionalAccess', _6 => _6.find, 'call', _7 => _7((priority)=>priority.blockchain === blockchain && priority.address.toLowerCase() === token.address.toLowerCase())])){ return }
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
            drip(assetWithBalance);
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
        const token = new Token(asset);
        return token.balance(options.accounts[asset.blockchain])
          .then(async(balance)=>{
            if(exists({ assets, asset })) { return resolve() }
            const assetWithBalance = reduceAssetWithBalance(asset, balance);
            if(assetWithBalance.balance != '0') {
              if(assetWithBalance.name === undefined) {
                assetWithBalance.name = await token.name();
              }
              if(assetWithBalance.symbol === undefined) {
                assetWithBalance.symbol = await token.symbol();
              }
              if(assetWithBalance.decimals === undefined) {
                assetWithBalance.decimals = await token.decimals();
              }
              assets.push(assetWithBalance);
              drip(assetWithBalance);
              resolve(assetWithBalance);
            } else {
              resolve();
          }}).catch((error)=>{ console.log(error); resolve(); })
      })
    })));
  }

  await Promise.all(promises);

  assets.sort((a,b)=>sortPriorities(priorities, a, b));

  dripQueue.forEach((asset)=>drip(asset, false));

  return assets
};

export { dripAssets, getAssets };
