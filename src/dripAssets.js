/*#if _EVM

import Token from '@depay/web3-tokens-evm'

/*#elif _SVM

import Token from '@depay/web3-tokens-svm'

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

const sortPriorities = (priorities, a,b)=>{
  if(!priorities || priorities.length === 0) { return 0 }
  let priorityIndexOfA = priorities.indexOf([a.blockchain, a.address.toLowerCase()].join(''))
  let priorityIndexOfB = priorities.indexOf([b.blockchain, b.address.toLowerCase()].join(''))
  
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
}

const promiseWithTimeout = (promise, timeout = 10000) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), timeout)) // Resolve with null on timeout
  ]);
};

export default async (options) => {
  if(options === undefined) { options = { accounts: {}, priority: [] } }

  let assets = []
  let dripped = []
  let promises = []
  let priorities = Array.isArray(options.priority) ? options.priority.map(priority => [priority.blockchain, priority.address.toLowerCase()].join('')) : []
  let drippedIndex = 0
  let dripQueue = []

  const drip = (asset)=>{
    if (!asset || typeof options.drip !== 'function') { return } // Ensure asset is valid
    const assetAsKey = [asset.blockchain, asset.address.toLowerCase()].join('')
    if(dripped.indexOf(assetAsKey) > -1) { return }
    dripped.push(assetAsKey)
    options.drip(asset)
  }

  // Prioritized Assets
  promises = promises.concat((options.priority || []).map((asset)=>{
    return promiseWithTimeout(new Promise(async (resolve) => {
      try {
        let token = new Token(asset)
        let completedAsset = Object.assign({},
          asset,
          {
            name: await token.name(),
            symbol: await token.symbol(),
            decimals: await token.decimals(),
            balance: (await token.balance(options.accounts[asset.blockchain])).toString(),
            type: Blockchains[asset.blockchain].currency.address.toLowerCase() === asset.address.toLowerCase() ? 'NATIVE' : '20'
          }
        )
        if(completedAsset.balance != '0') {
          if(exists({ assets, asset })) { return resolve(null) } // Resolve with null if already exists
          assets.push(completedAsset)
          resolve(completedAsset)
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error('Error fetching prioritized asset:', asset, error)
        resolve(null) // Resolve with null to prevent blocking
      }
    }))
  }))

  // Major Tokens
  let majorTokens = []
  for (var blockchain in options.accounts){
    Blockchains.findByName(blockchain).tokens.forEach((token)=>{
      if(isFiltered({ options, address: token.address, blockchain })){ return }
      if(options?.priority?.find((priority)=>priority.blockchain === blockchain && priority.address.toLowerCase() === token.address.toLowerCase())){ return }
      majorTokens.push(Object.assign({}, token, { blockchain }))
    })
  }

  promises = promises.concat((majorTokens.map((asset)=>{
    return promiseWithTimeout(new Promise((resolve) => {
      new Token(asset).balance(options.accounts[asset.blockchain])
        .then((balance)=>{
          if(exists({ assets, asset })) { return resolve(null) } // Resolve with null if already exists
          const assetWithBalance = reduceAssetWithBalance(asset, balance)
          if(assetWithBalance.balance != '0') {
            assets.push(assetWithBalance)
            resolve(assetWithBalance)
          } else {
            resolve(null)
        }}).catch((error)=>{
          console.error('Error fetching major token balance:', asset, error)
          resolve(null) // Resolve with null on error
        })
    }))
  })))

  // All other assets
  if(options.only == undefined || Object.keys(options.only).every((list)=>list.length == 0)) {
    try {
      let allAssets = await getAssets(options)
      promises = promises.concat((allAssets.map((asset)=>{
        return promiseWithTimeout(new Promise((resolve) => {
          const token = new Token(asset)
          return token.balance(options.accounts[asset.blockchain])
            .then(async(balance)=>{
              if(exists({ assets, asset })) { return resolve(null) } // Resolve with null if already exists
              const assetWithBalance = reduceAssetWithBalance(asset, balance)
              if(assetWithBalance.balance != '0') {
                if(assetWithBalance.name === undefined) {
                  assetWithBalance.name = await token.name()
                }
                if(assetWithBalance.symbol === undefined) {
                  assetWithBalance.symbol = await token.symbol()
                }
                if(assetWithBalance.decimals === undefined) {
                  assetWithBalance.decimals = await token.decimals()
                }
                assets.push(assetWithBalance)
                resolve(assetWithBalance)
              } else {
                resolve(null)
            }}).catch((error)=>{
              console.error('Error fetching asset balance:', asset, error)
              resolve(null) // Resolve with null on error
            })
        }))
      })))
    } catch (error) {
      console.error('Error fetching all assets:', error)
    }
  }

  // Ensure all promises are resolved
  const resolvedAssets = await Promise.all(promises)

  // Drip prioritized assets first in their defined order
  priorities.forEach(priorityKey => {
    const asset = resolvedAssets.find(a => a && [a.blockchain, a.address.toLowerCase()].join('') === priorityKey) // Ensure valid asset
    if (asset) {
      drip(asset)
    }
  })

  // Drip non-prioritized assets
  resolvedAssets.forEach(asset => {
    if (!asset) return // Ensure valid asset
    const assetKey = [asset.blockchain, asset.address.toLowerCase()].join('')
    if (!priorities.includes(assetKey)) {
      drip(asset)
    }
  })

  // Sort assets based on priorities before returning
  assets.sort((a,b)=>sortPriorities(priorities, a, b))

  return assets
}
