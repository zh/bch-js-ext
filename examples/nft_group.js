const MAINNET_API = 'https://api.fullstack.cash/v3/'
const SLPDB_API = 'https://slpdb.fountainhead.cash/'

const BCHJSEXT = require('../src/bch-js-ext')
const bchjs = new BCHJSEXT({
  restURL: MAINNET_API,
  slpdbURL: SLPDB_API,
  apiToken: process.env.BCHJSTOKEN
})

const fs = require('fs')

let paymentAccount
try {
  paymentAccount = require('./account.json')
} catch (err) {
  console.log(
    "Could not open account.json: { address: '...', wif: '...'}"
  )
  process.exit(0)
}

async function createNFTGroup () {
  try {
    const groupNFT = {
      name: 'Rare Items',
      ticker: '_rare.items'
    }

    const childNFT = {
      name: 'Very Rare Item #1',
      ticker: '_item.tresure.one'
    }
    const groupId = await bchjs.NFT.createGroup(paymentAccount, groupNFT, true)
    console.log(`Group NFT (${groupNFT.ticker}): ${groupId}`)
    childNFT.group = groupId
    fs.writeFile('./child.json', JSON.stringify(childNFT, null, 2), function (err) {
      if (err) return console.error(err)
      console.log('child.json written successfully.')
    })
  } catch (error) {
    console.error('error in createNFTGroup: ', error)
  }
}

createNFTGroup()
