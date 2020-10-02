const ADDR = 'bitcoincash: -- put some address here -- '

const MAINNET_API = 'https://api.fullstack.cash/v3/'
const SLPDB_API = 'https://slpdb.fountainhead.cash/'

const BCHJSEXT = require('../src/bch-js-ext')
const bchjs = new BCHJSEXT({
  restURL: MAINNET_API,
  slpdbURL: SLPDB_API,
  apiToken: process.env.BCHJSTOKEN
})

async function getDetails (addr, payment = true) {
  try {
    const utxos = await bchjs.Ext.getUtxoDetails(addr)
    console.log(`all utxos: ${JSON.stringify(utxos, null, 2)}`)
    if (payment === true) {
      const paymentUtxo = await bchjs.Ext.findPaymentUtxo(addr)
      console.log(`payment utxo: ${JSON.stringify(paymentUtxo, null, 2)}`)
    }
  } catch (error) {
    console.error('error in getDetails: ', error)
  }
}

getDetails(ADDR)
