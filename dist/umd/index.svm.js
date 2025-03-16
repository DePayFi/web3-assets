(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@depay/web3-client-svm'), require('@depay/web3-blockchains'), require('@depay/web3-tokens-svm')) :
  typeof define === 'function' && define.amd ? define(['exports', '@depay/web3-client-svm', '@depay/web3-blockchains', '@depay/web3-tokens-svm'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Web3Assets = {}, global.Web3Client, global.Web3Blockchains, global.Web3Tokens));
}(this, (function (exports, web3ClientSvm, Blockchains, Token) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var Blockchains__default = /*#__PURE__*/_interopDefaultLegacy(Blockchains);
  var Token__default = /*#__PURE__*/_interopDefaultLegacy(Token);

  const ensureNativeTokenAsset = async ({ address, options, assets, blockchain }) => {
    if(options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>(only.toLowerCase() == Blockchains__default['default'][blockchain].currency.address.toLowerCase()))){ return assets }
    if(options.exclude && options.exclude[blockchain] && !!options.exclude[blockchain].find((exclude)=>(exclude.toLowerCase() == Blockchains__default['default'][blockchain].currency.address.toLowerCase()))){ return assets }

    const nativeTokenMissing = !assets.find((asset)=>(asset.address.toLowerCase() == Blockchains__default['default'][blockchain].currency.address.toLowerCase()));
    if(nativeTokenMissing) {
      let balance = await web3ClientSvm.request(
        {
          blockchain: blockchain,
          address,
          method: 'balance',
        },
        { cache: 30000 }
      );
      assets = [{
        name: Blockchains__default['default'][blockchain].currency.name,
        symbol: Blockchains__default['default'][blockchain].currency.symbol,
        address: Blockchains__default['default'][blockchain].currency.address,
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
            .catch(() => { resolve([]); })
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
            .catch(() => { resolve([]); });
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

  const promiseWithTimeout = (promise, timeout = 10000) => {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(null), timeout)) // Resolve with null on timeout
    ]);
  };

  var dripAssets = async (options) => {
    if(options === undefined) { options = { accounts: {}, priority: [] }; }

    let assets = [];
    let dripped = [];
    let promises = [];
    let priorities = Array.isArray(options.priority) ? options.priority.map(priority => [priority.blockchain, priority.address.toLowerCase()].join('')) : [];

    const drip = (asset)=>{
      if (!asset || typeof options.drip !== 'function') { return } // Ensure asset is valid
      const assetAsKey = [asset.blockchain, asset.address.toLowerCase()].join('');
      if(dripped.indexOf(assetAsKey) > -1) { return }
      dripped.push(assetAsKey);
      options.drip(asset);
    };

    // Prioritized Assets
    promises = promises.concat((options.priority || []).map((asset)=>{
      return promiseWithTimeout(new Promise(async (resolve) => {
        try {
          let token = new Token__default['default'](asset);
          let completedAsset = Object.assign({},
            asset,
            {
              name: await token.name(),
              symbol: await token.symbol(),
              decimals: await token.decimals(),
              balance: (await token.balance(options.accounts[asset.blockchain])).toString(),
              type: Blockchains__default['default'][asset.blockchain].currency.address.toLowerCase() === asset.address.toLowerCase() ? 'NATIVE' : '20'
            }
          );
          if(completedAsset.balance != '0') {
            if(exists({ assets, asset })) { return resolve(null) } // Resolve with null if already exists
            assets.push(completedAsset);
            resolve(completedAsset);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Error fetching prioritized asset:', asset, error);
          resolve(null); // Resolve with null to prevent blocking
        }
      }))
    }));

    // Major Tokens
    let majorTokens = [];
    for (var blockchain in options.accounts){
      Blockchains__default['default'].findByName(blockchain).tokens.forEach((token)=>{
        if(isFiltered({ options, address: token.address, blockchain })){ return }
        if(_optionalChain([options, 'optionalAccess', _ => _.priority, 'optionalAccess', _2 => _2.find, 'call', _3 => _3((priority)=>priority.blockchain === blockchain && priority.address.toLowerCase() === token.address.toLowerCase())])){ return }
        majorTokens.push(Object.assign({}, token, { blockchain }));
      });
    }

    promises = promises.concat((majorTokens.map((asset)=>{
      return promiseWithTimeout(new Promise((resolve) => {
        new Token__default['default'](asset).balance(options.accounts[asset.blockchain])
          .then((balance)=>{
            if(exists({ assets, asset })) { return resolve(null) } // Resolve with null if already exists
            const assetWithBalance = reduceAssetWithBalance(asset, balance);
            if(assetWithBalance.balance != '0') {
              assets.push(assetWithBalance);
              resolve(assetWithBalance);
            } else {
              resolve(null);
          }}).catch((error)=>{
            console.error('Error fetching major token balance:', asset, error);
            resolve(null); // Resolve with null on error
          });
      }))
    })));

    // All other assets
    if(options.only == undefined || Object.keys(options.only).every((list)=>list.length == 0)) {
      try {
        let allAssets = await getAssets(options);
        promises = promises.concat((allAssets.map((asset)=>{
          return promiseWithTimeout(new Promise((resolve) => {
            const token = new Token__default['default'](asset);
            return token.balance(options.accounts[asset.blockchain])
              .then(async(balance)=>{
                if(exists({ assets, asset })) { return resolve(null) } // Resolve with null if already exists
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
                  resolve(assetWithBalance);
                } else {
                  resolve(null);
              }}).catch((error)=>{
                console.error('Error fetching asset balance:', asset, error);
                resolve(null); // Resolve with null on error
              })
          }))
        })));
      } catch (error) {
        console.error('Error fetching all assets:', error);
      }
    }

    // Ensure all promises are resolved
    const resolvedAssets = await Promise.all(promises);

    // Drip prioritized assets first in their defined order
    priorities.forEach(priorityKey => {
      const asset = resolvedAssets.find(a => a && [a.blockchain, a.address.toLowerCase()].join('') === priorityKey); // Ensure valid asset
      if (asset) {
        drip(asset);
      }
    });

    // Drip non-prioritized assets
    resolvedAssets.forEach(asset => {
      if (!asset) return // Ensure valid asset
      const assetKey = [asset.blockchain, asset.address.toLowerCase()].join('');
      if (!priorities.includes(assetKey)) {
        drip(asset);
      }
    });

    // Sort assets based on priorities before returning
    assets.sort((a,b)=>sortPriorities(priorities, a, b));

    return assets
  };

  exports.dripAssets = dripAssets;
  exports.getAssets = getAssets;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
