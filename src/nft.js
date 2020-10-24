const axios = require('axios')

const DUST = 546

class NFT {
  constructor (config) {
    const tmp = {}
    if (!config || !config.slpdbURL) tmp.slpdbURL = 'https://slpdb.fountainhead.cash/'
    else tmp.slpdbURL = config.slpdbURL

    this.slpdbURL = tmp.slpdbURL
    this.bchjs = config.bchjs
    this.txFee = config.txFee || 450

    this.Types = {
      BATON: { utxoType: 'minting-baton', tokenType: 129 }, // mint baton
      STEM: { utxoType: 'token', tokenType: 129 }, // cloned baton
      CHILD: { utxoType: 'token', tokenType: 65 } // NFT child
    }
  }

  /*
    account = { address: 'bitcoincash:....', wif: 'L3...' }
    config = { name: 'GR1', prefix: '_ns' }
    config = { name: 'GR1', ticker: '_ns.aaaa' }
  */
  async createGroup (account, config, send = false) {
    try {
      const legacyAddress = this.bchjs.SLP.Address.toLegacyAddress(account.address)
      let tickerName
      if (config.ticker) {
        tickerName = config.ticker
      } else {
        tickerName = config.prefix ? `${config.prefix}.${config.name}` : config.name
      }
      const docURL = config.url ? config.url : 'https://github.com/zh'
      const mintConfig = {
        name: config.name,
        ticker: tickerName,
        documentUrl: docURL,
        mintBatonVout: 2,
        initialQty: 1
      }
      const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo(account.address)
      const remainder = paymentUtxo.value - (2 * DUST) - this.txFee

      const txBuilder = new this.bchjs.TXBuilder(this.bchjs)
      const script = this.bchjs.SLP.NFT1.newNFTGroupOpReturn(mintConfig)
      const outputs = [
        { out: script }, // OUT#0 OP_RETURN
        { out: legacyAddress, value: DUST }, // OUT#1 token
        { out: legacyAddress, value: DUST }, // OUT#2 minting baton
        { out: account.address, value: remainder } // OUT#3 remainder
      ]
      txBuilder.addOutputs(outputs)
      const inputs = [{ utxo: paymentUtxo }] // IN#0 pay
      txBuilder.addSignedInputs(account.wif, inputs)
      return await txBuilder.sendTx(send)
    } catch (error) {
      console.error('Error in createGroup: ', error)
      throw error
    }
  }

  /*
    account = { address: 'bitcoincash:....', wif: 'L3...' }
    config = { group: 'b3sssdd...', name: 'CHLD1', prefix: '_uns' }
    config = { group: 'b3sssdd...', name: 'CHLD1', ticker: '_yns.bbb.aaaa' }
  */
  async createChild (account, config, send = false) {
    try {
      const legacyAddress = this.bchjs.SLP.Address.toLegacyAddress(account.address)
      await this.cloneBaton(account, config.group, send)
      const tokenUtxos = await this.bchjs.Ext.getTokenUtxos(account.address, config.group, this.Types.STEM)
      if (tokenUtxos.length === 0) {
        throw new Error('No token UTXOs with the specified Id could be found.')
      }
      let tickerName
      if (config.ticker) {
        tickerName = config.ticker
      } else {
        tickerName = config.prefix ? `${config.prefix}.${config.name}` : config.name
      }
      const docURL = config.url ? config.url : 'https://github.com/zh'
      const mintConfig = {
        name: config.name,
        ticker: tickerName,
        documentUrl: docURL
      }
      const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo(account.address)
      const remainder = paymentUtxo.value - DUST - this.txFee

      const txBuilder = new this.bchjs.TXBuilder(this.bchjs)
      const script = this.bchjs.SLP.NFT1.generateNFTChildGenesisOpReturn(mintConfig)
      const outputs = [
        { out: script }, // OUT#0 OP_RETURN
        { out: legacyAddress, value: DUST }, // OUT#1 token
        { out: account.address, value: remainder } // OUT#2 remainder
      ]
      txBuilder.addOutputs(outputs)
      const inputs = [
        { utxo: tokenUtxos[0], value: DUST }, // IN#0 colned baton
        { utxo: paymentUtxo } // IN#1 pay
      ]
      txBuilder.addSignedInputs(account.wif, inputs)
      return await txBuilder.sendTx(send)
    } catch (error) {
      console.error('Error in createChild: ', error)
      throw error
    }
  }

  /*
    account = { address: 'bitcoincash:....', wif: 'L3...' }
    toAddr = 'bitcoincash:....'
    config = { ticker: '_uns.bbb.aaa' }
    config = { id: 'b3sssdd...' }
  */
  async transferChild (account, config, toAddr, send = false) {
    try {
      const legacyTo = this.bchjs.SLP.Address.toLegacyAddress(toAddr)
      let tokenUtxos
      if (config.ticker) {
        tokenUtxos = await this.bchjs.Ext.getTickerUtxos(account.address, config.ticker, this.Types.CHILD)
      } else {
        tokenUtxos = await this.bchjs.Ext.getTokenUtxos(account.address, config.id, this.Types.CHILD)
      }
      if (tokenUtxos.length === 0) {
        throw new Error('No token UTXOs with the specified Id could be found.')
      }
      const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo(account.address)
      const remainder = paymentUtxo.value - DUST - this.txFee

      const txBuilder = new this.bchjs.TXBuilder(this.bchjs)
      const slpSendObj = this.bchjs.SLP.NFT1.generateNFTChildSendOpReturn(tokenUtxos, 1)
      const slpData = slpSendObj.script
      const outputs = [
        { out: slpData }, // OUT#0 OP_RETURN
        { out: legacyTo, value: DUST }, // OUT#1 send 1 token
        { out: account.address, value: remainder } // OUT#2 remainder
      ]
      txBuilder.addOutputs(outputs)
      const inputs = [
        { utxo: paymentUtxo }, // IN#0 pay
        { utxo: tokenUtxos[0] } // IN#1 token to send
      ]
      txBuilder.addSignedInputs(account.wif, inputs)
      return await txBuilder.sendTx(send)
    } catch (error) {
      console.error('Error in transferChild: ', error)
      throw error
    }
  }

  /*
    account = { address: 'bitcoincash:....', wif: 'L3...' }
    config = { ticker: '_uns.bbb.aaa' }
    config = { id: 'b3sssdd...' }
  */
  async removeChild (account, config, send = false) {
    try {
      const legacyAddress = this.bchjs.SLP.Address.toLegacyAddress(account.address)
      let tokenUtxos
      if (config.ticker) {
        tokenUtxos = await this.bchjs.Ext.getTickerUtxos(account.address, config.ticker, this.Types.CHILD)
      } else {
        tokenUtxos = await this.bchjs.Ext.getTokenUtxos(account.address, config.id, this.Types.CHILD)
      }
      if (tokenUtxos.length === 0) {
        throw new Error('No token UTXOs with the specified Id could be found.')
      }
      const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo(account.address)
      const remainder = paymentUtxo.value - DUST - this.txFee

      const txBuilder = new this.bchjs.TXBuilder(this.bchjs)
      const slpData = this.bchjs.SLP.TokenType1.generateBurnOpReturn(tokenUtxos, 1)
      const outputs = [
        { out: slpData }, // OUT#0 OP_RETURN
        { out: legacyAddress, value: DUST }, // OUT#1 burn 1 token
        { out: account.address, value: remainder } // OUT#2 remainder
      ]
      txBuilder.addOutputs(outputs)
      const inputs = [
        { utxo: paymentUtxo }, // IN#0 pay
        { utxo: tokenUtxos[0] } // IN#1 token to burn
      ]
      txBuilder.addSignedInputs(account.wif, inputs)
      return await txBuilder.sendTx(send)
    } catch (error) {
      console.error('Error in removeChild: ', error)
      throw error
    }
  }

  // internal use only
  async cloneBaton (account, groupId, send = false) {
    try {
      const legacyAddress = this.bchjs.SLP.Address.toLegacyAddress(account.address)
      const tokenUtxos = await this.bchjs.Ext.getTokenUtxos(account.address, groupId, this.Types.BATON)
      if (tokenUtxos.length === 0) {
        throw new Error('No token UTXOs with the specified ID could be found.')
      }
      const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo(account.address)
      const remainder = paymentUtxo.value - (2 * DUST) - this.txFee

      const txBuilder = new this.bchjs.TXBuilder(this.bchjs)
      const script = this.bchjs.SLP.NFT1.mintNFTGroupOpReturn(tokenUtxos, 1)
      const outputs = [
        { out: script }, // OUT#0 OP_RETURN
        { out: legacyAddress, value: DUST }, // OUT#1 token
        { out: legacyAddress, value: DUST }, // OUT#2 minting baton
        { out: account.address, value: remainder } // OUT#3 remainder
      ]
      txBuilder.addOutputs(outputs)
      const inputs = [
        { utxo: paymentUtxo }, // IN#0 pay
        { utxo: tokenUtxos[0], value: DUST } // IN#1 minting baton
      ]
      txBuilder.addSignedInputs(account.wif, inputs)
      return await txBuilder.sendTx(send)
    } catch (error) {
      console.error('Error in cloneBaton: ', error)
      throw error
    }
  }

  async findChildren (groupId) {
    try {
      const query = {
        v: 3,
        q: {
          db: ['t'],
          aggregate: [
            {
              $match: {
                nftParentId: groupId
              }
            },
            {
              $skip: 0
            },
            {
              $limit: 100
            }
          ]
        }
      }
      const queryStr = JSON.stringify(query)
      const b64 = Buffer.from(queryStr).toString('base64')
      const url = `${this.slpdbURL}q/${b64}`
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
        url
      }
      const result = await axios(options)
      if (!result.data || !result.data.t) {
        return {}
      }
      const allTokenIds = result.data.t.map(token => token.tokenDetails.tokenIdHex)
      const validIds = await this.validTokens(allTokenIds)
      return result.data.t.filter(function (token) {
        if (validIds.includes(token.tokenDetails.tokenIdHex)) return true
        return false
      })
    } catch (error) {
      console.error('Error in findChildren: ', error)
      console.log(`groupId: ${groupId}`)
      throw error
    }
  }

  async tokenAddresses (tokenId) {
    try {
      const query = {
        v: 3,
        q: {
          db: ['g'],
          aggregate: [
            {
              $match: {
                'tokenDetails.tokenIdHex': tokenId
              }
            },
            {
              $unwind: '$graphTxn.outputs'
            },
            {
              $match: {
                'graphTxn.outputs.status': 'UNSPENT'
              }
            },
            {
              $group: {
                _id: '$graphTxn.outputs.address',
                slpAmount: {
                  $sum: '$graphTxn.outputs.slpAmount'
                }
              }
            },
            {
              $match: {
                slpAmount: {
                  $gt: 0
                }
              }
            }
          ],
          limit: 100,
          skip: 0
        }
      }
      const queryStr = JSON.stringify(query)
      const b64 = Buffer.from(queryStr).toString('base64')
      const url = `${this.slpdbURL}q/${b64}`
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
        url
      }
      const result = await axios(options)
      if (!result.data || !result.data.g || result.data.g.length === 0) {
        return {}
      }
      const slpInfo = result.data.g[0]
      if (slpInfo.slpAmount !== '1') { // amount > 1 -> Not NFT
        return ''
      }
      return slpInfo._id
    } catch (error) {
      console.error('Error in tokenAddresses: ', error)
      console.log(`tokenId: ${tokenId}`)
      throw error
    }
  }

  async validTokens (tokenIds) {
    try {
      const query = {
        v: 3,
        q: {
          db: ['g'],
          aggregate: [
            {
              $match: {
                'tokenDetails.tokenIdHex': {
                  $in: tokenIds
                }
              }
            },
            {
              $unwind: '$graphTxn.outputs'
            },
            {
              $match: {
                'graphTxn.outputs.status': 'UNSPENT',
                'graphTxn.outputs.slpAmount': {
                  $gt: 0
                }
              }
            }
          ],
          limit: 100,
          skip: 0
        }
      }
      const queryStr = JSON.stringify(query)
      const b64 = Buffer.from(queryStr).toString('base64')
      const url = `${this.slpdbURL}q/${b64}`
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
        url
      }
      const result = await axios(options)
      if (!result.data || !result.data.g || result.data.g.length === 0) {
        return {}
      }
      return result.data.g.map(token => token.graphTxn.details.tokenIdHex)
    } catch (error) {
      console.error('Error in tokenBurnHistory: ', error)
      throw error
    }
  }
}

module.exports = NFT
