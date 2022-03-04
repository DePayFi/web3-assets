import { CONSTANTS } from '@depay/web3-constants'
import { getWallet } from '@depay/web3-wallets'
import { request } from '@depay/web3-client'

const ensureNativeTokenAsset = async ({ account, assets, blockchain }) => {
  if(assets.find((asset)=> {
    return asset.address.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()
  }) == undefined) {
    let balance = await request(
      {
        blockchain: blockchain,
        address: account,
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

const getAssets = async (options) => {
  if(options === undefined) { options = {} }
  
  let wallet = await getWallet()

  let account
  if(options.account) {
    account = options.account
  } else if(wallet) {
    account = await wallet.account()
  }
  if (!account) { return }

  let assets = Promise.all(
    (options.blockchain ? [options.blockchain] : undefined || wallet.blockchains).map((blockchain) =>{
      
      return fetch(`https://api.depay.fi/v2/accounts/${blockchain}/${account}/assets`)
        .then((response) => response.json())
        .then(async (assets) => {
          return await ensureNativeTokenAsset({
            account,
            assets: assets.map((asset) => Object.assign(asset, { blockchain })),
            blockchain
          })
        })
    }),
  ).then((responses) => responses.flat())

  return assets
}

export { getAssets }
