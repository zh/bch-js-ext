const MAINNET_API = 'https://api.fullstack.cash/v3/'
const SLPDB_API = 'https://slpdb.fountainhead.cash/'

const BCHJSEXT = require('../src/bch-js-ext')
const bchjs = new BCHJSEXT({
  restURL: MAINNET_API,
  slpdbURL: SLPDB_API,
  apiToken: process.env.BCHJSTOKEN
})

let paymentAccount
try {
  paymentAccount = require('./account.json')
} catch (err) {
  console.log(
    "Could not open account.json: { address: '...', wif: '...'}"
  )
  process.exit(0)
}

let childNFT
try {
  childNFT = require('./child.json')
} catch (err) {
  console.log(
    'Could not open child.json. Generate with `node nft_group.js` first.'
  )
  process.exit(0)
}

const fs = require('fs')

async function createNFTChild () {
  try {
    const itemId = await bchjs.NFT.createChild(paymentAccount, childNFT, true)
    console.log(`NFT Child (${childNFT.ticker}): ${itemId}`)
    childNFT.id = itemId
    fs.writeFile('./child.json', JSON.stringify(childNFT, null, 2), function (err) {
      if (err) return console.error(err)
      console.log('child.json written successfully.')
    })
  } catch (error) {
    console.error('error in createNFTChild: ', error)
  }
}

createNFTChild()
