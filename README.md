# bch-js-ext

Extensions to [PSF bch-js](https://github.com/Permissionless-Software-Foundation/bch-js) JavaScript library.

`bch-js` is a great JavaScript library for working with Bitcoin Cash. The easiest way is to use it with the software stack provided by [FullStack.cash](https://fullstack.cash/).
The current library provides some extensions to `bch-js` like:

- Some useful methods for getting detailed UTXO information (`Ext module`)
- Easier transactions building (`TXBuilder module`)
- Working with groups of NFTs (`NFT module`)

## Usage

- Install library: `npm install bch-js-ext`
- Instantiate the library in your code:

```js
const MAINNET_API = 'https://api.fullstack.cash/v3/'
const SLPDB_API = 'https://slpdb.fountainhead.cash/'

const BCHJSEXT = require('bch-js-ext')
const bchjs = new BCHJSEXT({
  restURL: MAINNET_API,
  slpdbURL: SLPDB_API,
  apiToken: process.env.BCHJSTOKEN
})
```

For more detailed usage see the [examples directory](./examples) code.

## Library methods

### Ext module

These methods are used also in the other modules.

* `validAddress(address)` - check if given **BCH** or **SLP** address is valid
  * **address**: *String*. example: `'bitcoincash:eedddd...' or 'simpleledger:....'`
  * **return**: *true/false*

* `findBiggestUtxo(utxos)` - find UTXO with biggest value in an Array of UTXOs
  * **utxos**: *Array* of UTXO objects
  * **return**: *UTXO object*
 
```js
 const data = await bchjs.Electrumx.utxo('bitcoincash:dsffff...')
 const utxos = data.utxos
 const utxo = await bchjs.Ext.findBiggestUtxo(utxos)
```
* `findPaymentUtxo(address, amount = 0)` - using `findBiggestUtxo()` method above to find the UTXO with enough value in satoshis
  * **address**: *String*. example: `'bitcoincash:eedddd...'
  * **amount**: *Integer* (optional). If provided will check if UTXO have such amount of satoshis. If not provided will not check UTXO value at all

```js
const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo('bitcoincash:dsffff...')
```

* `getUtxoDetails(address)` - detailed information about UTXOs (`hydreted UTXOs`)
  * **address**: *String*. example: `'bitcoincash:eedddd...'
  * **return**: *Array* of hydrated UTXOs

```js
const tokenUtxos = await bchjs.Ext.getUtxoDetails('bitcoincash:dsffff...')
```

* Get UTXOs with detailed information about **particular token** (specified by ID or ticker)
  * `getTokenUtxos(address, tokenId, types = {})`
  * `getTickerUtxos(address, ticker, types = {})`
     * **address**: *String*. example: `'bitcoincash:eedddd...'
     * **tokenId**: *String*. example: `'b34esadd...'` 
     * **ticker**: *String*. example: `'NFT_TOKEN'`
     * **return**: *Array* of hydrated UTXOs

* `filterTokenUtxos(utxos, prefix)` - filter Array of token UTXOs for ones, which **ticker starts** with *prefix*
  * **utxos**: *Array* of hydrated UTXOs
  * **return**: *Array* of hydrated UTXOs

```js
const tokenUtxos = await bchjs.Ext.getUtxoDetails('bitcoincash:dsffff...')
const nameServiceUTXOs = await bchjs.Ext. filterTokenUtxos(tokenUtxos, '_ns.')
```

### TXBuilder module

These methods are used also in the NFT module.

Attaching input and output UTXOs during transaction building contain a lot of boilerplate code.
Specially signing ot input adds a lot of similar code. This module trying to make transaction buildeing easier. *TODO: maybe replace with CashScript in the future*

* `addSignedInputs(wif, inputs)` - add Array of input UTXOs and sign them
  * **wif**: *String*. Private key (WIF) for signing. example: `'L4.....'`
  * **inputs**: *Array* of `{ utxo: <UTXO object>, value: Integer }` objects. *value* is optional. if not provided - using UTXO value

* `addOutputs (outputs)` - add array of output UTXOs (payment, remainder etc.)
  * **outputs**: *Array* of `{ out: <address_or_script>, value: Integer }` objects. *value* is optional. if not provided - using UTXO value

Example (NFT group creation)

```js
const paymentUtxo = await this.bchjs.Ext.findPaymentUtxo(account.address)
const remainder = paymentUtxo.value - (2 * DUST) - TX_FEE
const txBuilder = new this.bchjs.TXBuilder(this.bchjs)
const script = this.bchjs.SLP.NFT1.newNFTGroupOpReturn(mintConfig)
const outputs = [
  { out: script }, // OUT#0 OP_RETURN
  { out: legacyAddress, value: DUST }, // OUT#1 token
  { out: legacyAddress, value: DUST }, // OUT#2 minting baton
  { out: bchAddress, value: remainder } // OUT#3 remainder
]
const inputs = [{ utxo: paymentUtxo }] // IN#0 pay
txBuilder.addSignedInputs(wif, inputs)
```

See NFT examples in the [example directory](./examples/) for more detailed usage information.   

### NFT module

Methods for easy Group/Children NFT non-fungible tokens operations - create, transfer, burn etc.

All of the methods have optional last parameter *send*:

  * **true**: send the TX to the blockchain
  * **false**: just create transaction HEX for inspection (**default**)

*account* parameter used as a first parameter in most of the calls:

```js
config = {
  address: 'bitcoincash: bdddfd....',
  wif: 'L3.....'
}
```

* `createGroup(account, config, send)` - create NFT group - can be used to create NFT children in the same group
  * **account**: *Object* with address and private key.
  * **config**: *Object* with token parameters. examples: `{ name: 'NFT NS', prefix: '_ns' }`, `{ name: 'TLD', ticker: '_ns.dom' }`

```js
const groupNFT = {
  name: 'Rare Items',
  ticker: '_rare.items'
}
const groupId = await bchjs.NFT.createGroup(account, groupNFT, true)
```

For more information: [examples/nft_group.js](./examples/nft_group.js)

* `createChild(account, config, send)` - create NFT child inside given NFT group
  * **account**: *Object* with address and private key.
  * **config**: *Object* with token parameters. examples: `{ group: 'b3sssdd...', name: 'CHLD1', prefix: '_uns' }`, `{ group: 'b3sssdd...', name: 'CHLD1', ticker: '_yns.bbb.aaaa' }`

```js
const childNFT = {
  group: 'dwgfdd...' // for example groupId in the example above
  name: 'Very Rare Item #1',
  ticker: '_item.tresure.one'
}
const itemId = await bchjs.NFT.createChild(paymentAccount, childNFT, true)
```

For more information: [examples/nft_child.js](./examples/nft_child.js)

* `transferChild(account, config, toSlpAddress, send)` - transfer ownership of token to another account (simple token sending to SLP address)
  * **account**: *Object* with address and private key.
  * **config**: *Object* with token information. example: `{ id: 'b3sssdd...' }`, `{ ticker: '_uns.bbb.aaa' }`. Can even reuse NFT child creation config above.
  * **toSlpAddress**: *String*. SLP address to send token to. example: `'simpleledger:ddsvs...'`

```js
const config = { id: 'dsfsdf...' } // for example tokenId from the example above
await bchjs.NFT.transferChild(account, config, 'simpleledger:dfgdfggd...', true)
```

For more information: [examples/nft_transfer.js](./examples/nft_transfer.js)

* `removeChild(account, config, send)` - burn child NFT token
  * **account**: *Object* with address and private key.
  * **config**: *Object* with token information. example: `{ id: 'b3sssdd...' }`, `{ ticker: '_uns.bbb.aaa' }`. Can even reuse NFT child creation config above.

```js
const config = { id: 'dsfsdf...' } // for example tokenId from the example above
await bchjs.NFT.removeChild(account, config, true)
```

* `findChildren(groupId)` - find all **non-burned NFT children** in a given group (created from the same group NFT token)
  * **groupId**: *String*. token ID of the NFT group - for example groupId in the examples above
  * **return**: *Array* of objects with token information (SLPDB response format)

```js
const children = await bchjs.NFT.findChildren('dhdfhf...')
```

* `tokenAddresses(tokenId)` - return the SLP address, owning given NFT child token
  * **tokenId**: *String*. token ID of the NFT child
  * **return**: *String* - SLP address

```js
const itemAddr = await bchjs.NFT.tokenAddresses('dhdfhf...')
```