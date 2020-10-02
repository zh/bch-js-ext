class Ext {
  constructor (config) {
    const tmp = {}
    if (!config || !config.restURL) tmp.restURL = 'https://api.fullstack.cash/v3/'
    else tmp.restURL = config.restURL

    this.restURL = tmp.restURL
    this.apiToken = config.apiToken
    this.bchjs = config.bchjs
  }

  async validAddress (address) {
    try {
      const legacyAddress = this.bchjs.SLP.Address.toLegacyAddress(address)
      const check = await this.bchjs.Util.validateAddress(legacyAddress)
      return check.isvalid
    } catch (error) {
      return false
    }
  }

  async findBiggestUtxo (utxos) {
    try {
      let largestAmount = 0
      let largestIndex = 0

      for (var i = 0; i < utxos.length; i++) {
        const thisUtxo = utxos[i]
        /* eslint-disable no-await-in-loop */
        const txout = await this.bchjs.Blockchain.getTxOut(thisUtxo.tx_hash, thisUtxo.tx_pos)
        /* eslint-enable no-await-in-loop */
        if (txout === null) {
          // If the UTXO has already been spent, the full node will respond with null.
          console.log(
            'Stale UTXO found. You may need to wait for the indexer to catch up.'
          )
          continue
        }

        if (thisUtxo.value > largestAmount) {
          largestAmount = thisUtxo.value
          largestIndex = i
        }
      }

      return utxos[largestIndex]
    } catch (error) {
      console.error('Error in findBiggestUtxo: ', error)
      throw error
    }
  }

  async findPaymentUtxo (addr, amount = 0) {
    try {
      const data = await this.bchjs.Electrumx.utxo(addr)
      const utxos = data.utxos
      if (utxos.length === 0) {
        throw new Error('No UTXOs to pay for transaction! Exiting.')
      }
      const utxo = await this.findBiggestUtxo(utxos)
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)
      if (amount > 0) {
        if (amount > utxo.value) throw new Error(`Not enough funds to pay (${utxo.value} < ${amount})`)
      }
      return utxo
    } catch (error) {
      console.error('Error in findPaymentUtxo: ', error)
      throw error
    }
  }

  async getUtxoDetails (addr) {
    try {
      const legacy = this.bchjs.SLP.Address.toLegacyAddress(addr)
      const result = await this.bchjs.Electrumx.utxo(legacy)
      if (result.utxos.length === 0) throw new Error('No Tokens UTXOs found.')

      return await this.bchjs.SLP.Utils.tokenUtxoDetails(result.utxos)
    } catch (error) {
      console.error('Error in getUtxoDetails: ', error)
      console.log(`BCH Addr: ${addr}`)
      throw error
    }
  }

  async getTokenUtxos (addr, tokenId, types = {}) {
    try {
      let tokenUtxos = await this.getUtxoDetails(addr)
      tokenUtxos = tokenUtxos.filter(function (utxo) {
        if (types.utxoType && utxo.utxoType !== types.utxoType) return false
        if (types.tokenType && utxo.tokenType !== types.tokenType) return false
        if (utxo.tokenId === tokenId) return true
        return false
      })

      return tokenUtxos
    } catch (error) {
      console.error('Error in getTokenUtxos: ', error)
      console.log(`BCH Addr: ${addr}`)
      throw error
    }
  }

  async getTickerUtxos (addr, ticker, types = {}) {
    try {
      let tokenUtxos = await this.getUtxoDetails(addr)
      tokenUtxos = tokenUtxos.filter(function (utxo) {
        if (types.utxoType && utxo.utxoType !== types.utxoType) return false
        if (types.tokenType && utxo.tokenType !== types.tokenType) return false
        if (utxo.tokenTicker === ticker) return true
        return false
      })

      return tokenUtxos
    } catch (error) {
      console.error('Error in getTickerUtxos: ', error)
      console.log(`BCH Addr: ${addr}`)
      throw error
    }
  }

  async filterTokenUtxos (utxos, prefix) {
    try {
      let tokenUtxos = utxos
      let exists = []
      tokenUtxos = tokenUtxos.filter(function (utxo) {
        if (!utxo || !utxo.tokenTicker) return false
        if (exists.includes(utxo.tokenTicker)) return false // uniq
        if (utxo.tokenTicker.startsWith(prefix)) {
          exists.push(utxo.tokenTicker)
          return true
        }
        return false
      })
      return tokenUtxos
    } catch (error) {
      console.error('Error in filterTokenUtxos: ', error)
      console.log(`BCH Addr: ${addr}`)
      throw error
    }
  }
}

module.exports = Ext
