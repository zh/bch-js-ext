const RECEIVER = 'simpleledger: -- put some SLP address here --'

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

async function transferNFTChild (toSlpAddr) {
  try {
    let itemAddr = await bchjs.NFT.tokenAddresses(childNFT.id)
    console.log(`NFT Child address: ${JSON.stringify(itemAddr, null, 2)}`)
    if (itemAddr !== toSlpAddr) {
      await bchjs.NFT.transferChild(paymentAccount, childNFT, toSlpAddr, true)
      // it need some time to change - wait a little and run again
      itemAddr = await bchjs.NFT.tokenAddresses(childNFT.id)
      console.log(`NFT Child address: ${JSON.stringify(itemAddr, null, 2)}`)
    }
  } catch (error) {
    console.error('error in transferNFTChild: ', error)
  }
}

transferNFTChild(RECEIVER)
