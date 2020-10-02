const BCHJS = require('@psf/bch-js')

const Ext = require('./ext')
const NFT = require('./nft')
const TXBuilder = require('./tx-builder')

class BCHJSEXT extends BCHJS {
  constructor (config) {
    const bchjsConfig = {
      restURL: config.restURL,
      apiToken: config.apiToken
    }
    super(bchjsConfig)

    config.bchjs = this

    this.Ext = new Ext(config)
    this.NFT = new NFT(config)
    this.TXBuilder = TXBuilder
  }
}

module.exports = BCHJSEXT
