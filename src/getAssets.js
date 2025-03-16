/*#if _EVM

import { request } from '@depay/web3-client-evm'

/*#elif _SVM

import { request } from '@depay/web3-client-svm'

//#else */

import { request } from '@depay/web3-client'

//#endif

import Blockchains from '@depay/web3-blockchains'

const ensureNativeTokenAsset = async ({ address, options, assets, blockchain }) => {
  if(options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>(only.toLowerCase() == Blockchains[blockchain].currency.address.toLowerCase()))){ return assets }
  if(options.exclude && options.exclude[blockchain] && !!options.exclude[blockchain].find((exclude)=>(exclude.toLowerCase() == Blockchains[blockchain].currency.address.toLowerCase()))){ return assets }

  const nativeTokenMissing = !assets.find((asset)=>(asset.address.toLowerCase() == Blockchains[blockchain].currency.address.toLowerCase()))
  if(nativeTokenMissing) {
    let balance = await request(
      {
        blockchain: blockchain,
        address,
        method: 'balance',
      },
      { cache: 30000 }
    )
    assets = [{
      name: Blockchains[blockchain].currency.name,
      symbol: Blockchains[blockchain].currency.symbol,
      address: Blockchains[blockchain].currency.address,
      type: 'NATIVE',
      blockchain,
      balance: balance.toString()
    }, ...assets]
  }
  return assets
}

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
}

export default async (options) => {
  if(options === undefined) { options = { accounts: {} } }

  let assets = Promise.all(
    (Object.keys(options.accounts)).map((blockchain) =>{

      return new Promise((resolve, reject)=>{
        const address = options.accounts[blockchain]
        const controller = new AbortController()
        setTimeout(()=>controller.abort(), 10000)
        fetch(`https://public.depay.com/accounts/${blockchain}/${address}/assets`, { signal: controller.signal })
          .catch(() => { resolve([]) })
          .then((response) => {
            if(response && response.ok) {
              return response.json()
            } else {
              resolve([])
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
              resolve([])
            }
          })
          .then(resolve)
          .catch(() => { resolve([]) })
      })
    }),
  ).then((responses) => responses.flat())

  return assets
}
