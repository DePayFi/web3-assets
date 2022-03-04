import fetchMock from 'fetch-mock'
import { getAssets } from 'src'
import { mock, resetMocks } from '@depay/web3-mock'
import { provider, resetCache } from '@depay/web3-client'

describe('assets', ()=>{

  beforeEach(()=>fetchMock.reset())
  beforeEach(resetMocks)
  beforeEach(resetCache)
  afterEach(resetMocks)
  const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
  beforeEach(()=>{
    mock({ blockchain: 'ethereum', accounts: { return: accounts } })
    mock({ blockchain: 'bsc', accounts: { return: accounts } })
  })

  describe('fetch assets for connected wallet', ()=>{

    beforeEach(()=>{
      mock({ blockchain: 'ethereum', wallet: 'metamask' })
      fetchMock.get({
          url: 'https://public.depay.fi/v2/accounts/ethereum/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/assets',
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
          url: 'https://public.depay.fi/v2/accounts/bsc/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/assets',
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
  })
  
  describe('fetch assets for given account (no connected wallet)', ()=>{

    it('fetches the assets for a given account without any connected wallet', async()=> {
      let account = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://public.depay.fi/v2/accounts/ethereum/${account}/assets`,
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

  describe('NATIVE currency missing via API', ()=>{

    beforeEach(()=>{
      mock({ blockchain: 'ethereum', wallet: 'metamask' })
      fetchMock.get({
          url: 'https://public.depay.fi/v2/accounts/ethereum/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/assets',
        }, [{
          "name": "Dai Stablecoin",
          "symbol": "DAI",
          "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "type": "ERC20"
        }]
      )
      fetchMock.get({
          url: 'https://public.depay.fi/v2/accounts/bsc/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/assets',
        }, [{
          "name": "PancakeSwap",
          "symbol": "CAKE",
          "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
          "type": "BEP20"
        }]
      )
    })

    it('ensures fetching asset for NATIVE currency', async()=> {
      let ethereumBalanceMock = mock({ 
        provider: provider('ethereum'),
        blockchain: 'ethereum',
        balance: {
          for: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          return: '22222221'
        }
      })
      let bscBalanceMock = mock({ 
        provider: provider('bsc'),
        blockchain: 'bsc',
        balance: {
          for: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          return: '3333333335'
        }
      })

      let assets = await getAssets({ apiKey: 'TEST-123' })

      expect(assets.find((a)=>a.name=='Ether').balance).toEqual('22222221')
      expect(assets.find((a)=>a.name=='Binance Coin').balance).toEqual('3333333335')

      expect(ethereumBalanceMock).toHaveBeenCalled()
      expect(bscBalanceMock).toHaveBeenCalled()
    })
  })
})
