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
    const txBuilder = new bchjs.TXBuilder(bchjs)
    const remainder = utxo.value - amount - FEE
    txBuilder.addOutput(to, amount)
    txBuilder.addOutput(from, remainder)
    await txBuilder.addPaymentInput(from, wif, utxo)
    const hex = await txBuilder.sendTx()
    console.log(`result: ${JSON.stringify(hex, null, 2)}`)
  } catch (error) {
    console.error('error in makeSimplePayment: ', error)
  }
}

makeSimplePayment(SENDER, SENDER_WIF, RECEIVER, PAYMENT)
