import fetchMock from 'fetch-mock'
import { getAssets } from 'src'
import { mock, resetMocks } from '@depay/web3-mock'
import { provider, resetCache } from '@depay/web3-client'

describe('getAssets', ()=>{

  beforeEach(()=>fetchMock.reset())
  beforeEach(resetMocks)
  beforeEach(resetCache)
  afterEach(resetMocks)
  
  describe('fetch assets for given accounts', ()=>{

    it('fetches the assets for a given account without any connected wallet', async()=> {
      let address = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://public.depay.fi/accounts/ethereum/${address}/assets`,
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
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      fetchMock.get({
          url: `https://public.depay.fi/accounts/bsc/${address}/assets`,
        }, [{
          "name": "BNB",
          "symbol": "BNB",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      expect(await getAssets({ accounts: { ethereum: address, bsc: address } })).toEqual([
        {
          name: 'Ether',
          symbol: 'ETH',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          balance: '1300000000000000000',
          blockchain: 'ethereum'
        },
        {
          name: 'DePay',
          symbol: 'DEPAY',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          type: '20',
          balance: '1000000000000000000',
          blockchain: 'ethereum'
        },
        {
          name: 'BNB',
          symbol: 'BNB',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          balance: '1300000000000000000',
          blockchain: 'bsc'
        },
        {
          name: 'DePay',
          symbol: 'DEPAY',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          type: '20',
          balance: '1000000000000000000',
          blockchain: 'bsc'
        }
      ])
    })
  })

  describe('only', ()=> {
    
    it('only fetches the requested assets (Type 20 Tokens)', async()=> {
      let address = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://public.depay.fi/accounts/ethereum/${address}/assets`,
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
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      fetchMock.get({
          url: `https://public.depay.fi/accounts/bsc/${address}/assets`,
        }, [{
          "name": "BNB",
          "symbol": "BNB",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      expect(await getAssets({ only: { ethereum: ['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'], bsc: ['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'] }, accounts: { ethereum: address, bsc: address } })).toEqual([
        {
          name: 'DePay',
          symbol: 'DEPAY',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          type: '20',
          balance: '1000000000000000000',
          blockchain: 'ethereum'
        },
        {
          name: 'DePay',
          symbol: 'DEPAY',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          type: '20',
          balance: '1000000000000000000',
          blockchain: 'bsc'
        }
      ])
    })

    it('only fetches the requested assets (NATIVE Tokens)', async()=> {
      let address = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://public.depay.fi/accounts/ethereum/${address}/assets`,
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
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      fetchMock.get({
          url: `https://public.depay.fi/accounts/bsc/${address}/assets`,
        }, [{
          "name": "BNB",
          "symbol": "BNB",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      expect(await getAssets({ only: { ethereum: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'], bsc: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'] }, accounts: { ethereum: address, bsc: address } })).toEqual([
        {
          name: 'Ether',
          symbol: 'ETH',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          balance: '1300000000000000000',
          blockchain: 'ethereum'
        },
        {
          name: 'BNB',
          symbol: 'BNB',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          balance: '1300000000000000000',
          blockchain: 'bsc'
        }
      ])
    })
  })

  describe('exclude', ()=> {
    
    it('excludes assets (Type 20 Tokens)', async()=> {
      let address = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://public.depay.fi/accounts/ethereum/${address}/assets`,
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
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      fetchMock.get({
          url: `https://public.depay.fi/accounts/bsc/${address}/assets`,
        }, [{
          "name": "BNB",
          "symbol": "BNB",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      expect(await getAssets({ exclude: { ethereum: ['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'], bsc: ['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'] }, accounts: { ethereum: address, bsc: address } })).toEqual([
        {
          name: 'Ether',
          symbol: 'ETH',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          balance: '1300000000000000000',
          blockchain: 'ethereum'
        },
        {
          name: 'BNB',
          symbol: 'BNB',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          type: 'NATIVE',
          balance: '1300000000000000000',
          blockchain: 'bsc'
        }
      ])
    })

    it('excludes assets (NATIVE Tokens)', async()=> {
      let address = '0xEcA533Ef096f191A35DE76aa4580FA3A722724bE'
      fetchMock.get({
          url: `https://public.depay.fi/accounts/ethereum/${address}/assets`,
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
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      fetchMock.get({
          url: `https://public.depay.fi/accounts/bsc/${address}/assets`,
        }, [{
          "name": "BNB",
          "symbol": "BNB",
          "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          "type": "NATIVE",
          "balance": "1300000000000000000"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": "0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb",
          "type": "20",
          "balance": "1000000000000000000"
        }]
      )
      expect(await getAssets({ exclude: { ethereum: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'], bsc: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'] }, accounts: { ethereum: address, bsc: address } })).toEqual([
        {
          name: 'DePay',
          symbol: 'DEPAY',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          type: '20',
          balance: '1000000000000000000',
          blockchain: 'ethereum'
        },
        {
          name: 'DePay',
          symbol: 'DEPAY',
          address: '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb',
          type: '20',
          balance: '1000000000000000000',
          blockchain: 'bsc'
        }
      ])
    })
  })

  describe('NATIVE currency missing via API', ()=>{

    beforeEach(()=>{
      mock({ blockchain: 'ethereum', wallet: 'metamask' })
      fetchMock.get({
          url: 'https://public.depay.fi/accounts/ethereum/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/assets',
        }, [{
          "name": "Dai Stablecoin",
          "symbol": "DAI",
          "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "type": "20"
        }]
      )
      fetchMock.get({
          url: 'https://public.depay.fi/accounts/bsc/0xd8da6bf26964af9d7eed9e03e53415d37aa96045/assets',
        }, [{
          "name": "PancakeSwap",
          "symbol": "CAKE",
          "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
          "type": "20"
        }]
      )
    })

    it('ensures fetching asset for NATIVE currency if it was missing in the api response', async()=> {
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

      let assets = await getAssets({ accounts: { ethereum: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', bsc: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' }})

      expect(assets.find((a)=>a.symbol=='ETH').balance).toEqual('22222221')
      expect(assets.find((a)=>a.symbol=='BNB').balance).toEqual('3333333335')

      expect(ethereumBalanceMock).toHaveBeenCalled()
      expect(bscBalanceMock).toHaveBeenCalled()
    })
  })
})
