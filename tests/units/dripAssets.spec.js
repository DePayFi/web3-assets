import fetchMock from 'fetch-mock'
import { Blockchain } from '@depay/web3-blockchains'
import { dripAssets } from 'src'
import { mock, resetMocks } from '@depay/web3-mock'
import { provider as providerFor, resetCache } from '@depay/web3-client'
import { Token } from '@depay/web3-tokens'

describe('dripAssets', ()=>{

  beforeEach(()=>fetchMock.reset())
  beforeEach(resetMocks)
  beforeEach(resetCache)
  afterEach(resetMocks)

  const accounts = ['0xEcA533Ef096f191A35DE76aa4580FA3A722724bE']
  const blockchains = ['ethereum', 'bsc']

  beforeEach(()=>{
    blockchains.forEach((blockchain)=>{
      const provider = providerFor(blockchain)
      mock({ accounts: { return: accounts }, provider, blockchain })
      mock({ balance: { for: accounts[0], return: '123456789' }, provider, blockchain })
      Blockchain.findByName(blockchain).tokens.forEach((token)=>{
        if(token.type == '20') {
          mock({ call: { return: '123456789', to: token.address, api: Token[blockchain].DEFAULT, method: 'balanceOf', params: accounts[0] }, provider, blockchain })
        }
      })
      mock({ call: { return: '56789', to: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', api: Token[blockchain].DEFAULT, method: 'balanceOf', params: accounts[0] }, provider, blockchain })
    })

    fetchMock.get({ url: `https://public.depay.fi/accounts/ethereum/${accounts[0]}/assets` },
      [{
        "name": "Ether",
        "symbol": "ETH",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "type": "NATIVE",
        "balance": "1300000000000000000"
      }, {
        "name": "DePay",
        "symbol": "DEPAY",
        "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
        "type": "20",
        "balance": "1000000000000000000",
        "decimals": 18
      }]
    )

    fetchMock.get({ url: `https://public.depay.fi/accounts/bsc/${accounts[0]}/assets` },
      [{
        "name": "BNB Coin",
        "symbol": "BNB",
        "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "type": "NATIVE",
        "balance": "1300000000000000000"
      }, {
        "name": "DePay",
        "symbol": "DEPAY",
        "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
        "type": "20",
        "balance": "1000000000000000000",
        "decimals": 18
      }]
    )
  })

  describe('drips assets for given accounts (first all major tokens per blockchain, then all further assets)', ()=>{

    it('drips assets one by one immediatelly after it has been found/resolved', async()=> {
      let drippedAssets = []
      let dripsCount = 0
      
      let allAssets = await dripAssets({ 
        accounts: { ethereum: accounts[0], bsc: accounts[0] },
        drip: (asset)=>{
          dripsCount++
          drippedAssets.push(asset)
        }
      })

      expect(dripsCount).toEqual(20)

      let expectedAssets = [{
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          type: 'NATIVE',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'BNB',
          name: 'Binance Coin',
          decimals: 18,
          type: 'NATIVE',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          symbol: 'WBTC',
          name: 'Wrapped BTC',
          decimals: 8,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
          symbol: 'FRAX',
          name: 'Frax',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
          symbol: 'BUSD',
          name: 'Binance USD',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
          symbol: 'USDP',
          name: 'Pax Dollar',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
          symbol: 'FEI',
          name: 'Fei USD',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
          symbol: 'WBNB',
          name: 'Wrapped BNB',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          symbol: 'BUSD',
          name: 'BUSD Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x55d398326f99059fF775485246999027B3197955',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
          symbol: 'ETH',
          name: 'Ethereum Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
          symbol: 'Cake',
          name: 'PancakeSwap Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
          symbol: 'BTCB',
          name: 'BTCB Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          balance: '56789',
          blockchain: 'ethereum',
          decimals: 18,
          name: 'DePay',
          symbol: 'DEPAY',
          type: '20'
        },
        {
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          balance: '56789',
          blockchain: 'bsc',
          decimals: 18,
          name: 'DePay',
          symbol: 'DEPAY',
          type: '20'
        }
      ]

      expect(drippedAssets).toEqual(expectedAssets)
      expect(allAssets).toEqual(expectedAssets)
    })
  })

  describe('prioritizes given list of assets when dripping assets', ()=>{

    it('drips according to given priority list', async()=>{
      let drippedAssets = []
      let dripsCount = 0

      blockchains.forEach((blockchain)=>{
        const provider = providerFor(blockchain)
        mock({ call: { return: 'DePay', to: '0xa0bed124a09ac2bd941b10349d8d224fe3c955eb', api: Token[blockchain].DEFAULT, method: 'name' }, provider, blockchain })
        mock({ call: { return: 'DEPAY', to: '0xa0bed124a09ac2bd941b10349d8d224fe3c955eb', api: Token[blockchain].DEFAULT, method: 'symbol' }, provider, blockchain })
        mock({ call: { return: 18, to: '0xa0bed124a09ac2bd941b10349d8d224fe3c955eb', api: Token[blockchain].DEFAULT, method: 'decimals' }, provider, blockchain })
      })

      mock({ call: { return: 'Wrapped Ether', to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', api: Token['ethereum'].DEFAULT, method: 'name' }, provider: providerFor('ethereum'), blockchain: 'ethereum' })
      mock({ call: { return: 'WETH', to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', api: Token['ethereum'].DEFAULT, method: 'symbol' }, provider: providerFor('ethereum'), blockchain: 'ethereum' })
      mock({ call: { return: 18, to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', api: Token['ethereum'].DEFAULT, method: 'decimals' }, provider: providerFor('ethereum'), blockchain: 'ethereum' })

      mock({ call: { return: 'Wrapped BNB', to: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', api: Token['bsc'].DEFAULT, method: 'name' }, provider: providerFor('bsc'), blockchain: 'bsc' })
      mock({ call: { return: 'BNB', to: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', api: Token['bsc'].DEFAULT, method: 'symbol' }, provider: providerFor('bsc'), blockchain: 'bsc' })
      mock({ call: { return: 18, to: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', api: Token['bsc'].DEFAULT, method: 'decimals' }, provider: providerFor('bsc'), blockchain: 'bsc' })
      
      let allAssets = await dripAssets({ 
        accounts: { ethereum: accounts[0], bsc: accounts[0] },
        priority: [
          { blockchain: 'ethereum', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
          { blockchain: 'bsc', address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb' },
          { blockchain: 'ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
          { blockchain: 'bsc', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
        ],
        drip: (asset)=>{
          dripsCount++
          drippedAssets.push(asset)
        }
      })

      expect(dripsCount).toEqual(20)

      let expectedAssets = [
        {
          blockchain: 'ethereum',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          name: 'DePay',
          symbol: 'DEPAY',
          decimals: 18,
          balance: '56789'
        },
        {
          blockchain: 'bsc',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          name: 'DePay',
          symbol: 'DEPAY',
          decimals: 18,
          balance: '56789'
        },
        {
          blockchain: 'ethereum',
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          name: 'Wrapped Ether',
          symbol: 'WETH',
          decimals: 18,
          balance: '123456789'
        },
        {
          blockchain: 'bsc',
          address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
          name: 'Wrapped BNB',
          symbol: 'BNB',
          decimals: 18,
          balance: '123456789'
        },
        {
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          type: 'NATIVE',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'BNB',
          name: 'Binance Coin',
          decimals: 18,
          type: 'NATIVE',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
          symbol: 'WBTC',
          name: 'Wrapped BTC',
          decimals: 8,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
          symbol: 'FRAX',
          name: 'Frax',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
          symbol: 'BUSD',
          name: 'Binance USD',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
          symbol: 'USDP',
          name: 'Pax Dollar',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
          symbol: 'FEI',
          name: 'Fei USD',
          decimals: 18,
          type: '20',
          blockchain: 'ethereum',
          balance: '123456789'
        },
        {
          address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          symbol: 'BUSD',
          name: 'BUSD Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x55d398326f99059fF775485246999027B3197955',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
          symbol: 'ETH',
          name: 'Ethereum Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
          symbol: 'Cake',
          name: 'PancakeSwap Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        },
        {
          address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
          symbol: 'BTCB',
          name: 'BTCB Token',
          decimals: 18,
          type: '20',
          blockchain: 'bsc',
          balance: '123456789'
        }
      ]

      expect(drippedAssets).toEqual(expectedAssets)
      expect(allAssets).toEqual(expectedAssets)
    })
  })
})
