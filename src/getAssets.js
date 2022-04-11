import { CONSTANTS } from '@depay/web3-constants'
import { request } from '@depay/web3-client'

const ensureNativeTokenAsset = async ({ address, options, assets, blockchain }) => {
  if(options.only && options.only[blockchain] && !options.only[blockchain].find((only)=>(only.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()))){ return assets }
  if(options.exclude && options.exclude[blockchain] && !!options.exclude[blockchain].find((exclude)=>(exclude.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()))){ return assets }

  const nativeTokenMissing = !assets.find((asset)=>(asset.address.toLowerCase() == CONSTANTS[blockchain].NATIVE.toLowerCase()))
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

      const address = options.accounts[blockchain]
      
      return fetch(`https://public.depay.fi/accounts/${blockchain}/${address}/assets`)
        .catch((error) => { console.log(error) })
        .then((response) => response.json())
        .then(async (assets) => {
          return await ensureNativeTokenAsset({
            address,
            options,
            assets: filterAssets({ assets, blockchain, options }).map((asset) => Object.assign(asset, { blockchain })),
            blockchain
          })
        }).catch((error) => { console.log(error) })
    }),
  ).then((responses) => responses.flat())

  return assets
}
