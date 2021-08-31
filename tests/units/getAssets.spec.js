import fetchMock from 'fetch-mock'
import { getAssets } from 'src'
import { mock, resetMocks } from 'depay-web3-mock'

describe('assets', ()=>{

  beforeEach(()=>fetchMock.reset())
  beforeEach(resetMocks)
  afterEach(resetMocks)

  it('raises an error if api key is not set', async ()=>{
    mock('ethereum')
    global.fetch = jest.fn()
    await expect(
      ()=>getAssets()
    ).rejects.toEqual('Web3Wallets: Please pass an apiKey. See documentation.')
  })

  describe('fetch assets', ()=>{

    beforeEach(()=>{
      mock({ blockchain: 'ethereum', wallet: 'metamask' })
      fetchMock.get({
          url: 'https://api.depay.pro/v1/assets?account=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&blockchain=ethereum',
          headers: { 'X-Api-Key': 'TEST-123' }
        }, [{
          "name": "Ether",
          "symbol": "ETH",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE"
        }, {
          "name": "Dai Stablecoin",
          "symbol": "DAI",
          "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "type": "ERC20"
        }]
      )
      fetchMock.get({
          url: 'https://api.depay.pro/v1/assets?account=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&blockchain=bsc',
          headers: { 'X-Api-Key': 'TEST-123' }
        }, [{
          "name": "Binance Coin",
          "symbol": "BNB",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE"
        }, {
          "name": "PancakeSwap",
          "symbol": "CAKE",
          "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
          "type": "BEP20"
        }]
      )
    })

    it('fetches all assets for all supported blockchains that the connected wallet supports', async ()=> {
      let assets = await getAssets({ apiKey: 'TEST-123' })
      expect(assets).toEqual([
        {
          name: 'Ether',
          symbol: 'ETH',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          blockchain: 'ethereum'
        },
        {
          name: 'Dai Stablecoin',
          symbol: 'DAI',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          type: 'ERC20',
          blockchain: 'ethereum'
        },
        {
          name: 'Binance Coin',
          symbol: 'BNB',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          blockchain: 'bsc'
        },
        {
          name: 'PancakeSwap',
          symbol: 'CAKE',
          address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
          type: 'BEP20',
          blockchain: 'bsc'
        }
      ])
    })

    it('fetches only the assets of the given blockchain', async()=> {
      expect(await getAssets({ blockchain: 'ethereum', apiKey: 'TEST-123' })).toEqual([
        {
          name: 'Ether',
          symbol: 'ETH',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          blockchain: 'ethereum'
        },
        {
          name: 'Dai Stablecoin',
          symbol: 'DAI',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          type: 'ERC20',
          blockchain: 'ethereum'
        }
      ])
      expect(await getAssets({ blockchain: 'bsc', apiKey: 'TEST-123' })).toEqual([
        {
          name: 'Binance Coin',
          symbol: 'BNB',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          blockchain: 'bsc'
        },
        {
          name: 'PancakeSwap',
          symbol: 'CAKE',
          address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
          type: 'BEP20',
          blockchain: 'bsc'
        }
      ])
    })

    it('fetches the assets for a given account', async()=> {
      let account = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://api.depay.pro/v1/assets?account=${account}&blockchain=ethereum`,
          headers: { 'X-Api-Key': 'TEST-123' }
        }, [{
          "name": "Ether",
          "symbol": "ETH",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "ERC20",
          "balance": "1000000000000000000"
        }]
      )
      expect(await getAssets({ account, blockchain: 'ethereum', apiKey: 'TEST-123' })).toEqual([
        {
          "blockchain": "ethereum",
          "name": "Ether",
          "symbol": "ETH",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "blockchain": "ethereum",
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "ERC20",
          "balance": "1000000000000000000"
        }
      ])
    })
  })
})
