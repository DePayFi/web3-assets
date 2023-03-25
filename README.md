## Quickstart

```
yarn add @depay/web3-assets
```

or 

```
npm install --save @depay/web3-assets
```

```javascript
import { getAssets } from '@depay/web3-assets'

let assets = await getAssets({
  accounts: {
    ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950',
    bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950' 
  } 
})
//[
// {
//   "name": "Dai Stablecoin",
//   "symbol": "DAI",
//   "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
//   "blockchain": "ethereum",
//   "type": "20",
//   "balance": "8007804249707967889272"
// }, {
//   "name": "DePay",
//   "symbol": "DEPAY",
//   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
//   "blockchain": "ethereum",
//   "type": "20",
//   "balance": "212816860003097638129"
// }, {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "20",
//   "balance": "2221112213212321"
// }
//]
```

```javascript
import { dripAssets } from '@depay/web3-assets'

let allAssets = await dripAssets({
  accounts: { ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950', bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950' },
  priority: [
    { blockchain: 'ethereum', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
    { blockchain: 'bsc', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
    { blockchain: 'ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { blockchain: 'bsc', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' }
  ],
  drip: (asset)=>{
    // {
    //   "name": "DePay",
    //   "symbol": "DEPAY",
    //   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
    //   "blockchain": "ethereum",
    //   "type": "20",
    //   "balance": "212816860003097638129"
    // }
  }
})
```

## Support

This library supports the following blockchains:

- [Ethereum](https://ethereum.org)
- [BNB Smart Chain](https://www.binance.org/smartChain)
- [Polygon](https://polygon.technology)
- [Solana](https://solana.com)
- [Fantom](https://fantom.foundation)
- [Velas](https://velas.com)

## Platform specific packaging

In case you want to use and package only specific platforms, use the platform-specific package:

### EVM platform specific packaging

```javascript
import { getAssets } from '@depay/web3-assets-evm'
```

### Solana platform specific packaging

```javascript
import { getAssets } from '@depay/web3-assets-solana'
```

## Functionalities

### getAssets

Retrieves all assets of the given account on the given blockchains:

```javascript

import { getAssets } from '@depay/web3-assets'

let assets = await getAssets({
  accounts: {
    ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950',
    bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950'
  }
})
//[
// {
//   "name": "Dai Stablecoin",
//   "symbol": "DAI",
//   "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
//   "blockchain": "ethereum",
//   "type": "20",
//   "balance": "8007804249707967889272"
// }, {
//   "name": "DePay",
//   "symbol": "DEPAY",
//   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
//   "blockchain": "ethereum",
//   "type": "20",
//   "balance": "212816860003097638129"
// }, {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "20",
//   "balance": "2221112213212321"
// }
//]
```

Timeout happens after 10s and `[]` will be returned in cases the assets for the given addresses can't be retrieved within 10s.

#### only (getAssets)

Only gets assets and balances for given token addresses.

```javascript

import { getAssets } from '@depay/web3-assets'

let assets = await getAssets({
  accounts: {
    ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950',
    bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950'
  },
  only: {
    ethereum: ['0x6B175474E89094C44Da98b954EedeAC495271d0F'],
    bsc: ['0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82']
  }
})
//[
// {
//   "name": "Dai Stablecoin",
//   "symbol": "DAI",
//   "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
//   "blockchain": "ethereum",
//   "type": "20",
//   "balance": "8007804249707967889272"
// }, {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "20",
//   "balance": "2221112213212321"
// }
//]
```

#### exclude (getAssets)

Excludes given assets

```javascript

import { getAssets } from '@depay/web3-assets'

let assets = await getAssets({
  accounts: {
    ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950',
    bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950'
  },
  exclude: {
    ethereum: ['0x6B175474E89094C44Da98b954EedeAC495271d0F'],
    bsc: ['0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82']
  }
})
//[
// {
//   "name": "DePay",
//   "symbol": "DEPAY",
//   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
//   "blockchain": "ethereum",
//   "type": "20",
//   "balance": "212816860003097638129"
// }
//]
```

### dripAssets

Drips every single asset immediately after resolved and all assets after all assets have been resolved (just as getAssets):

```javascript
import { dripAssets } from '@depay/web3-assets'

let allAssets = await dripAssets({
  accounts: { ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950', bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950' },
  priority: [
    { blockchain: 'ethereum', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
    { blockchain: 'bsc', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
    { blockchain: 'ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { blockchain: 'bsc', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
  ],
  drip: (asset)=>{
    // {
    //   "name": "DePay",
    //   "symbol": "DEPAY",
    //   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
    //   "blockchain": "ethereum",
    //   "type": "20",
    //   "balance": "212816860003097638129"
    // }
  }
})
```

#### only (dripAssets)

Only drips assets and balances for given token addresses.

```javascript

import { dripAssets } from '@depay/web3-assets'

let assets = await dripAssets({
  accounts: {
    ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950',
    bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950'
  },
  only: {
    ethereum: ['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'],
    bsc: ['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']
  },
  drip: (asset)=>{
    // {
    //   "name": "DePay",
    //   "symbol": "DEPAY",
    //   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
    //   "blockchain": "ethereum",
    //   "type": "20",
    //   "balance": "212816860003097638129"
    // }
  }
})
```

#### exclude (dripAssets)

Drips all assets except the ones you "exclude":

```javascript

import { dripAssets } from '@depay/web3-assets'

let assets = await dripAssets({
  accounts: {
    ethereum: '0x08B277154218CCF3380CAE48d630DA13462E3950',
    bsc: '0x08B277154218CCF3380CAE48d630DA13462E3950'
  },
  exclude: {
    ethereum: ['0x6B175474E89094C44Da98b954EedeAC495271d0F'],
    bsc: ['0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82']
  },
  drip: (asset)=>{
    // {
    //   "name": "DePay",
    //   "symbol": "DEPAY",
    //   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
    //   "blockchain": "ethereum",
    //   "type": "20",
    //   "balance": "212816860003097638129"
    // }
  }
})
```

## Development

### Get started

```
yarn install
yarn dev
```

### Release

```
npm publish
```
