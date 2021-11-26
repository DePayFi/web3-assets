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

let assets = await getAssets({ apiKey: 'XXX' })
//[
// {
//   "name": "Dai Stablecoin",
//   "symbol": "DAI",
//   "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
//   "blockchain": "ethereum",
//   "type": "ERC20",
//   "balance": "8007804249707967889272"
// }, {
//   "name": "DePay",
//   "symbol": "DEPAY",
//   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
//   "blockchain": "ethereum",
//   "type": "ERC20",
//   "balance": "212816860003097638129"
// }, {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "BEP20",
//   "balance": "2221112213212321"
// }
//]
```

This requires you to have a [DePay PRO apiKey](https://depay.fi/documentation/api#introduction).

## Support

This library supports the following blockchains:

- [Ethereum](https://ethereum.org)
- [Binance Smart Chain](https://www.binance.org/en/smartChain)

This library supports the following wallets:

- [MetaMask](https://metamask.io)

## Functionalities

### getAssets

Retrieves all assets of the connected crypto wallet account for all supported blockchains at once.

This requires you to have a [DePay PRO apiKey](https://depay.fi/documentation/api#introduction).

```javascript

import { getAssets } from '@depay/web3-assets'

let assets = await getAssets({ apiKey: 'XXX' })
//[
// {
//   "name": "Dai Stablecoin",
//   "symbol": "DAI",
//   "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
//   "blockchain": "ethereum",
//   "type": "ERC20",
//   "balance": "8007804249707967889272"
// }, {
//   "name": "DePay",
//   "symbol": "DEPAY",
//   "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
//   "blockchain": "ethereum",
//   "type": "ERC20",
//   "balance": "212816860003097638129"
// }, {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "BEP20",
//   "balance": "2221112213212321"
// }
//]
```

Also allows you to retrieve assets only for a given blockchain:

```javascript
let assets = await getAssets({ blockchain: 'bsc', apiKey: 'XXX' })
//[
// {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "BEP20",
//   "balance": "2221112213212321"
// }
//]
```

Also allows you to retrieve assets for a given account for a given blockchain:

```javascript
let assets = await getAssets({ account: '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE', blockchain: 'bsc', apiKey: 'XXX' })
//[
// {
//   "name": "PancakeSwap Token",
//   "symbol": "CAKE",
//   "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
//   "blockchain": "bsc",
//   "type": "BEP20",
//   "balance": "2221112213212321"
// }
//]
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
