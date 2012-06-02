nodejs-mollie
=============

Node.js module to access the [Mollie](https://www.mollie.nl/) API.

## Dependencies

* [node-xml2json](http://search.npmjs.org/#/node-xml2json) ([github](https://github.com/Kenshin/node-xml2json/)) - This xml2json module is very light and fast.

## Installation

Installation is straightforward with NPM, this will take care of any dependencies. The release on NPM is always the latest stable version.

```
npm install mollie
```

## Usage

### Setup

To use account specific functions you need to specify your credentials in the **api** var. In your [account settings](https://www.mollie.nl/beheer/sms-diensten/instellingen/) you can set a password for the HTTP-API that can be different from your regular password. Communication with the API is always over HTTPS. The **api** setting takes these elements:

* **partnerid** - customer ID, required for payments ([lookup](https://www.mollie.nl/beheer/account/))

* **username** - your account username

* **password** - your account or HTTP-API password

### Hello world:

Below is a very basic example, including setup and call.

```js
var mollie = require('mollie')

// account credentials
mollie.api.partnerid = 1234
mollie.api.username = 'yourname'
mollie.api.password = 'yourapipass'

// get remaining credits
mollie.credits( console.log )
```

Output:

```js
{ type: 'credits',
  resultcode: 10,
  resultmessage: 'Credits available.',
  credits: 58.85,
  euro: 0 }
```

Or in case of an error

```js
{ type: 'credits',
  resultcode: 30,
  resultmessage: 'Incorrect username or password.',
  credits: 0,
  euro: 0 }
```

### Load from source

To load the module directly from sourcecode, require the module like this:

```js
var mollie = require('/path/to/mollie.js');
```

## mollie.credits

Get remaining account credits

```js
mollie.credits( console.log )
```
```js
{ type: 'credits',
  resultcode: 10,
  resultmessage: 'Credits available.',
  credits: 58.85,
  euro: 0 }
```

## mollie.hlr

**HLR-lookup (Network Query)**

Request the MNC network code for a number. A complete list with the codes can be found at [Wikipedia](http://en.wikipedia.org/wiki/Mobile_Network_Code). The response will be pushed to your HLR report URL as provided on your [SMS settings page](https://www.mollie.nl/beheer/sms-diensten/instellingen/).

* **reference** - your internal reference ID for this lookup, will be included in the report callback.

* **recipients** - the number to lookup in international format, digits only. Although the name is plural, provide only **one** number for each call.

```js
mollie.hlr(
	{
		recipients: 31612345678,
		reference:  'lookup123'
	},
	console.log
)
```

Output:

```js
{ type: 'sms',
  recipients: 1,
  success: 'true',
  resultcode: 10,
  resultmessage: 'Network query sent.' }
```

## mollie.sms

Send a normal or premium SMS to one or many recipients at once.

See the [API documentation](https://www.mollie.nl/beheer/sms-diensten/documentatie/sms/http/en/?s=premium) for details.

```js
mollie.sms(
	{
		originator: 'MyApp',
		recipients: '31612345678,31687654321',
		message:    'Hello world',
		gateway:	1,
		reference:	'abc123'
	},
	console.log
)
```

Output:

```js
{ type: 'sms',
  recipients: 2,
  success: 'true',
  resultcode: 10,
  resultmessage: 'Message successfully sent.' }
```

## iDEAL

Mollie provides a simple streamlined method for handling iDEAL payments. For this to work you need to an active payment profile. See the [API documentation](https://www.mollie.nl/beheer/betaaldiensten/documentatie/ideal/en/) for all the details and variables.

## mollie.ideal.banklist

On your payment page you first need to let the customer choose his bank.

**mollie.ideal.banklist ( [testmode], callback )**

* **testmode** - optional - **true**: returns a test-bank, all transactions are fake. **false**: returns real banks, all transactions are real with real money. The *default* is what you set on your account [iDEAL API testmode](https://www.mollie.nl/beheer/betaaldiensten/instellingen/) settings.

* **callback** - required - your callback function

###### Testmode enabled:

```js
mollie.ideal.banklist( true, console.log );
```

```js
{ '9999': { bank_id: 9999, bank_name: 'TBM Bank' } }
```

The key is the same as **bank_id**, this allows you to do quick reverse lookups.


###### Testmode disabled:

```js
mollie.ideal.banklist( console.log );
```

```js
{ '17': { bank_id: 17, bank_name: 'Rabobank' },
  '25': { bank_id: 25, bank_name: 'ABN AMRO' },
  '91': { bank_id: 91, bank_name: 'Friesland Bank' },
  '113': { bank_id: 113, bank_name: 'van Lanschot' },
  '329': { bank_id: 329, bank_name: 'Triodos Bank' },
  '465': { bank_id: 465, bank_name: 'ING' },
  '489': { bank_id: 489, bank_name: 'SNS Bank' },
  '497': { bank_id: 497, bank_name: 'ASN Bank' },
  '505': { bank_id: 505, bank_name: 'RegioBank' } }
```

## mollie.ideal.payment

Create an iDEAL payment.

```js
mollie.ideal.payment(
	{
		amount:			2000,
		bank_id:		9999,
		description:	'Invoice 20120012345',
		reporturl:		'http://myapp.tld/mollie/ideal',
		returnurl:		'http://myapp.tld/ideal/complete'
	},
	console.log
)		
```

```js
{ order: 
   { transaction_id: 'abcxyz',
     amount: 2000,
     currency: 'EUR',
     url: 'http://www.mollie.nl/partners/ideal-test-bank?order_nr=M0040123&amp;transaction_id=abcdef&amp;trxid=M0040123',
     message: 'Your iDEAL-payment has successfully been setup. Your customer should visit the given URL to make the payment' } }
```

## mollie.ideal.check

When the customer completes the payment the API will make a call on your **reporturl** with the **transaction_id** as **GET** argument. Then you can check the payment status **ONCE** with **mollie.ideal.check**. In the meantime the customer will be redirected to your **returnurl** and bring the **transaction_id** too, for cross-referencing.

* **testmode** - optional - set to *true* when using the TMB Bank (ID 9999).

* **transaction_id** - required - the transaction ID to check

```js
mollie.ideal.check(
	{
		testmode:		true,
		transaction_id:	'abcxyz'
	},
	console.log
)		
```

```js
{ order: 
   { transaction_id: 'abcxyz',
     amount: 2000,
     currency: 'EUR',
     payed: 'true',
     consumer: 
      { consumername: 'T. TEST',
        consumeraccount: 123456789,
        consumercity: 'Testdorp' },
     message: 'This iDEAL-order has successfuly been payed for, and this is the first time you check it.',
     status: 'Success' } }
```

The variable **payed** can be **true** only once, for security.

## mollie.ideal.paymentLink

Generate an iDEAL payment link to redirect the customer to. This is useful for emails and such. This way Mollie will take care of the banklist, payment creation and confirmation.

```js
mollie.ideal.paymentLink(
	{
		amount:			2000,
		description:	'Invoice 20120012345'
	},
	console.log
)
```

```js
{ link: 
   { url: 'https://secure.mollie.nl/pay/ideal/123-12ab3456/2000_Invoice_20120012345/abcxyz',
     message: 'Your iDEAL-link has been successfully setup. Your customer should visit the given URL to make the payment.' } }
```

You get the payment status by email.

## License

This code is **COPYLEFT** meaning you can do anything you like, except copyrighting it. It would be nice to refer back to the source in your code, for future reference:

https://github.com/fvdm/nodejs-mollie/