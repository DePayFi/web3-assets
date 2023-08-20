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

export default async (options) => {
  if(options === undefined) { options = { accounts: {}, priority: [] } }

  let assets = []
  let dripped = []
  let promises = []
  let priorities = options?.priority?.map((priority)=>[priority.blockchain, priority.address.toLowerCase()].join(''))
  let drippedIndex = 0
  let dripQueue = []

  const drip = (asset, recursive = true)=>{
    if(typeof options.drip !== 'function') { return }
    const assetAsKey = [asset.blockchain, asset.address.toLowerCase()].join('')
    if(dripped.indexOf(assetAsKey) > -1) { return }
    if(priorities && priorities.length && priorities.indexOf(assetAsKey) === drippedIndex) {
      dripped.push(assetAsKey)
      options.drip(asset)
      drippedIndex += 1
      if(!recursive){ return }
      dripQueue.forEach((asset)=>drip(asset, false))
    } else if(!priorities || priorities.length === 0 || drippedIndex >= priorities.length) {
      if(!priorities || priorities.length === 0 || priorities.indexOf(assetAsKey) === -1) {
        dripped.push(assetAsKey)
        options.drip(asset)
      } else if (drippedIndex >= priorities.length) {
        dripped.push(assetAsKey)
        options.drip(asset)
      }
    } else if(!dripQueue.find((queued)=>queued.blockchain === asset.blockchain && queued.address.toLowerCase() === asset.address.toLowerCase())) {
      dripQueue.push(asset)
      dripQueue.sort((a,b)=>sortPriorities(priorities, a, b))
    }
  }

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
            balance: (await token.balance(options.accounts[asset.blockchain])).toString(),
            type: Blockchains[asset.blockchain].currency.address.toLowerCase() === asset.address.toLowerCase() ? 'NATIVE' : '20'
          }
        )
        if(completedAsset.balance != '0') {
          if(exists({ assets, asset })) { return resolve() }
          assets.push(completedAsset)
          drip(completedAsset)
          resolve(completedAsset)
        } else {
          resolve()
        }
      } catch {
        resolve()
      }
    })
  }))
  Promise.all(promises).then(()=>{
    drippedIndex = priorities?.length || 0
    dripQueue.forEach((asset)=>drip(asset, false))
  })
  
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
    return new Promise((resolve, reject)=>{
      let requestOptions
      new Token(asset).balance(options.accounts[asset.blockchain])
        .then((balance)=>{
          if(exists({ assets, asset })) { return resolve() }
          const assetWithBalance = reduceAssetWithBalance(asset, balance)
          if(assetWithBalance.balance != '0') {
            assets.push(assetWithBalance)
            drip(assetWithBalance)
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
        const token = new Token(asset)
        return token.balance(options.accounts[asset.blockchain])
          .then(async(balance)=>{
            if(exists({ assets, asset })) { return resolve() }
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
              drip(assetWithBalance)
              resolve(assetWithBalance)
            } else {
              resolve()
          }}).catch((error)=>{ console.log(error); resolve() })
      })
    })))
  }

  await Promise.all(promises)

  assets.sort((a,b)=>sortPriorities(priorities, a, b))

  dripQueue.forEach((asset)=>drip(asset, false))

  return assets
}
