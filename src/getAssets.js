import { CONSTANTS } from '@depay/web3-constants'
import { request } from '@depay/web3-client'

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
    )
    assets = [{
      name: CONSTANTS[blockchain].CURRENCY,
      symbol: CONSTANTS[blockchain].SYMBOL,
      address: CONSTANTS[blockchain].NATIVE,
      type: 'NATIVE',
      blockchain,
      balance: balance.toString()
    }, ...assets]
  }
  return assets
}

export default async (options) => {
  if(options === undefined) { options = { accounts: {} } }

  let assets = Promise.all(
    (Object.keys(options.accounts)).map((blockchain) =>{

      const address = options.accounts[blockchain]
      
      return fetch(`https://public.depay.fi/accounts/${blockchain}/${address}/assets`)
        .catch((error) => { console.log(error) })
        .then((response) => response.json())
        .then(async (assets) => {
          return await ensureNativeTokenAsset({
            address,
            assets: assets.map((asset) => Object.assign(asset, { blockchain })),
            blockchain
          })
        }).catch((error) => { console.log(error) })
    }),
  ).then((responses) => responses.flat())

  return assets
}
