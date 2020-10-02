const SENDER = 'bitcoincash: -- put some BCH address here --'
const SENDER_WIF = '-- put private key (WIF) here --'
const RECEIVER = 'bitcoincash: -- put some BCH address here --'

const MAINNET_API = 'https://api.fullstack.cash/v3/'
const SLPDB_API = 'https://slpdb.fountainhead.cash/'

const BCHJSEXT = require('../src/bch-js-ext')
const bchjs = new BCHJSEXT({
  restURL: MAINNET_API,
  slpdbURL: SLPDB_API,
  apiToken: process.env.BCHJSTOKEN
})

const PAYMENT = 1000 // satoshi
const FEE = 350

async function makeSimplePayment (from, wif, to, amount) {
  try {
    const utxo = await bchjs.Ext.findPaymentUtxo(from)
    const remainder = utxo.value - amount - FEE

    const txBuilder = new bchjs.TXBuilder(bchjs)

    const outputs = [
      { out: to, value: amount }, // OUT#0 payment
      { out: from, value: remainder } // OUT#1 remainder
    ]
    txBuilder.addOutputs(outputs)

    const inputs = [{ utxo: utxo }] // IN#0 pay
    txBuilder.addSignedInputs(wif, inputs)

    const txid = await txBuilder.sendTx(true)
    console.log(`txid: ${JSON.stringify(txid, null, 2)}`)
  } catch (error) {
    console.error('error in makeSimplePayment: ', error)
  }
}

makeSimplePayment(SENDER, SENDER_WIF, RECEIVER, PAYMENT)
