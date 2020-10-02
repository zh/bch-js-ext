const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

class TXBuilder extends bchjs.TransactionBuilder {
  constructor (bchjs, network = 'mainnet') {
    super(network)
    this.bchjs = bchjs
  }

  // inputs = [ { utxo: {}, value: } ]
  addSignedInputs (wif, inputs) {
    try {
      // add all inputs
      for (let i = 0; i < inputs.length; i++) {
        this.addInput(inputs[i].utxo.tx_hash, inputs[i].utxo.tx_pos)
      }
      // sign all inputs
      const keyPair = this.bchjs.ECPair.fromWIF(wif)
      let redeemScript
      for (let i = 0; i < inputs.length; i++) {
        const amount = inputs[i].value ? inputs[i].value : inputs[i].utxo.value
        this.sign(
          i,
          keyPair,
          redeemScript,
          this.hashTypes.SIGHASH_ALL,
          amount
        )
      }
    } catch (error) {
      console.error('Error in addSignedInputs', error)
      throw error
    }
  }

  // outputs = [ { out: address, value: value }, { out: script, value: 0 } ]
  addOutputs (outputs) {
    try {
      // add all inputs
      for (let i = 0; i < outputs.length; i++) {
        const value = outputs[i].value ? outputs[i].value : 0
        this.addOutput(outputs[i].out, value)
      }
    } catch (error) {
      console.error('Error in addOutputs', error)
      throw error
    }
  }

  async sendTx (send = false) {
    const hex = this.build().toHex()
    if (send === false) return hex
    return this.bchjs.RawTransactions.sendRawTransaction([hex])
  }
}

module.exports = TXBuilder
