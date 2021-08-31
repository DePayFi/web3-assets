'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var depayWeb3Constants = require('depay-web3-constants');
var depayWeb3Wallets = require('depay-web3-wallets');
var depayWeb3Client = require('depay-web3-client');

const ensureNativeTokenAsset = async ({ account, assets, blockchain }) => {
  if(assets.find((asset)=> {
    return asset.address.toLowerCase() == depayWeb3Constants.CONSTANTS[blockchain].NATIVE.toLowerCase()
  }) == undefined) {
    let balance = await depayWeb3Client.request(
      {
        blockchain: blockchain,
        address: account,
        method: 'balance',
      },
      { cache: 30000 }
    );
    assets = [{
      name: depayWeb3Constants.CONSTANTS[blockchain].CURRENCY,
      symbol: depayWeb3Constants.CONSTANTS[blockchain].SYMBOL,
      address: depayWeb3Constants.CONSTANTS[blockchain].NATIVE,
      type: 'NATIVE',
      blockchain,
      balance: balance.toString()
    }, ...assets];
  }
  return assets
};

const getAssets = async (options) => {
  if(options === undefined) { options = {}; }
  
  let wallet = await depayWeb3Wallets.getWallet();
  if (!wallet) { return }

  let account;
  if(options.account) {
    account = options.account;
  } else {
    account = await wallet.account();
  }
  if (!account) { return }

  if(options.apiKey == undefined) { throw 'Web3Wallets: Please pass an apiKey. See documentation.' }
  
  let assets = Promise.all(
    (options.blockchain ? [options.blockchain] :  wallet.blockchains).map((blockchain) =>{
      
      return fetch('https://api.depay.pro/v1/assets?account=' + account + '&blockchain=' + blockchain, {
        headers: { 'X-Api-Key': options.apiKey }
      })
        .then((response) => response.json())
        .then(async (assets) => {
          return await ensureNativeTokenAsset({
            account,
            assets: assets.map((asset) => Object.assign(asset, { blockchain })),
            blockchain
          })
        })
    }),
  ).then((responses) => responses.flat());

  return assets
};

exports.getAssets = getAssets;
