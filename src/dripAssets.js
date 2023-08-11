/*#if _EVM

import Token from '@depay/web3-tokens-evm'

/*#elif _SOLANA

import Token from '@depay/web3-tokens-solana'

//#else */

import Token from '@depay/web3-tokens'

//#endif

import Blockchains from '@depay/web3-blockchains'
import getAssets from './getAssets'

const reduceAssetWithBalance = (asset, balance)=>{
  return Object.assign({}, {
    address: asset.address,
    symbol: asset.symbol,
    name: asset.name,
    decimals: asset.decimals,
    type: asset.type,
    blockchain: asset.blockchain
  }, { balance: balance.toString() })
}

const exists = ({ assets, asset })=> {
  return !!assets.find(element => element.blockchain == asset.blockchain && element.address.toLowerCase() == asset.address.toLowerCase())
}

const isFiltered = ({ options, address, blockchain })=> {
  if(options && options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>only.toLowerCase()==address.toLowerCase())){ 
    return true 
  }
  if(options && options.exclude && options.exclude[blockchain] && options.exclude[blockchain].find((only)=>only.toLowerCase()==address.toLowerCase())){
    return true 
  }
  return false
}

export default async (options) => {
  if(options === undefined) { options = { accounts: {}, priority: [] } }

  let assets = []
  let promises = []

  // Prioritized Assets
  
  promises = promises.concat((options.priority || []).map((asset)=>{
    return new Promise(async (resolve, reject)=>{
      try {
        let token = new Token(asset)
        let completedAsset = Object.assign({},
          asset,
          {
            name: await token.name(),
            symbol: await token.symbol(),
            decimals: await token.decimals(),
            balance: (await token.balance(options.accounts[asset.blockchain])).toString()
          }
        )
        if(completedAsset.balance != '0') {
          if(exists({ assets, asset })) { return resolve() }
          assets.push(completedAsset)
          if(typeof options.drip == 'function') { options.drip(completedAsset) }
          resolve(completedAsset)
        } else {
          resolve()
        }
      } catch {
        resolve()
      }
    })
  }))
  
  // Major Tokens
  
  let majorTokens = []
  for (var blockchain in options.accounts){
    Blockchains.findByName(blockchain).tokens.forEach((token)=>{
      if(isFiltered({ options, address: token.address, blockchain })){ return }
      majorTokens.push(Object.assign({}, token, { blockchain }))
    })
  }
  promises = promises.concat((majorTokens.map((asset)=>{
    return new Promise((resolve, reject)=>{
      let requestOptions
      new Token(asset).balance(options.accounts[asset.blockchain])
        .then((balance)=>{
          if(exists({ assets, asset })) { return resolve() }
          const assetWithBalance = reduceAssetWithBalance(asset, balance)
          if(assetWithBalance.balance != '0') {
            assets.push(assetWithBalance)
            if(typeof options.drip == 'function') { options.drip(assetWithBalance) }
            resolve(assetWithBalance)
          } else {
            resolve()
        }}).catch((error)=>{ console.log(error); resolve() })
    })
  })))

  // All other assets

  if(options.only == undefined || Object.keys(options.only).every((list)=>list.length == 0)) {
    let allAssets = await getAssets(options)
    promises = promises.concat((allAssets.map((asset)=>{
      return new Promise((resolve, reject)=>{
        return new Token(asset).balance(options.accounts[asset.blockchain])
          .then((balance)=>{
            if(exists({ assets, asset })) { return resolve() }
            const assetWithBalance = reduceAssetWithBalance(asset, balance)
            if(assetWithBalance.balance != '0') {
              assets.push(assetWithBalance)
              if(typeof options.drip == 'function') { options.drip(assetWithBalance) }
              resolve(assetWithBalance)
            } else {
              resolve()
          }}).catch((error)=>{ console.log(error); resolve() })
      })
    })))
  }

  await Promise.all(promises)

  return assets
}
