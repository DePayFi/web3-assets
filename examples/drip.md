```javascript
let allAssets = await Web3Assets.dripAssets({
  accounts: {
    ethereum: '0x317D875cA3B9f8d14f960486C0d1D1913be74e90',
    bsc: '0x317D875cA3B9f8d14f960486C0d1D1913be74e90',
    avalanche: '0x317D875cA3B9f8d14f960486C0d1D1913be74e90',
  },
  priority: [
    { blockchain: 'avalanche', address: Web3Blockchains.avalanche.currency.address },
    { blockchain: 'bsc', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
    { blockchain: 'ethereum', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
    { blockchain: 'ethereum', address: Web3Blockchains.ethereum.currency.address },
  ],
  drip: (asset)=>{
   console.log('drip asset', asset)
  }
})

console.log('allAssets', allAssets)
```


```javascript
let allAssets = await Web3Assets.dripAssets({
  accounts: {
    solana: '2UgCJaHU5y8NC4uWQcZYeV9a5RyYLF7iKYCybCsdFFD1',
  },
  priority: [
    { blockchain: 'solana', address: Web3Blockchains.solana.currency.address },
  ],
  drip: (asset)=>{
   console.log('drip asset', asset)
  }
})

console.log('allAssets', allAssets)
```
