mollie
======

Node.js module to access the Mollie payments API.

[![Build Status](https://travis-ci.org/fvdm/nodejs-mollie.svg?branch=master)](https://travis-ci.org/fvdm/nodejs-mollie)


* [Node.js](https://nodejs.org)
* [Mollie](https://www.mollie.com)
* [API documentation](https://www.mollie.com/en/docs)


Example
-------

Create a payment for order 112233 at €12.34, return the `paymentUrl` to the customer.

```js
var mollie = require ('mollie') ('test_apikey');

var payment = {
  amount: 12.34,
  description: 'Order #112233',
  redirectUrl: 'https://mywebshop.tld/order/112233',
  metadata: {
    order_id: 112233
  }
};

mollie.payments.create (payment, function (err, data) {
  if (err) { return console.log (err); }

  // i.e. redirect the user
  tellCustomer (data.links.paymentUrl);
});
```

Installation
------------

To use this module you need an [API key](https://www.mollie.com/beheer/account/profielen/) from your Mollie account.
It's recommended to use your **test* API key during development.

`npm install mollie`


Error handling
--------------

The callbacks receive two parameters, `err` and `data`.
When an error occurs `err` is an instance of `Error` with stack trace and additional properties, `data` will be not be available.
On success `err` is _null_ and `data` is the parsed API response.


#### Example

```js
function myCallback (err, data) {
  if (err) {
    console.log (err);
  } else {
    console.log (data.credits);
  }
}

mollie.methods (myCallback);
```


#### Errors

message          | description                         | properties
:----------------|:------------------------------------|:---------------------
request failed   | The request can not be made         | `error`
invalid response | The API response can't be processed | `error`, `statusCode`
API error        | The API return an error             | `error`, `statusCode`


Usage
-----

### payments.create

**( params, callback )**

Create a payment.


argument | type     | required | description
:--------|:---------|:---------|:-----------------
params   | object   | yes      | [Payment-object](https://www.mollie.com/en/docs/payments#payment-object)
callback | function | yes      | Callback function


```js
var paymentObject = {
  amount: 12.34,
  description: 'Order #112233',
  redirectUrl: 'https://mywebshop.tld/order/112233',
  metadata: {
    order_id: 112233
  }
};

mollie.payment.create (paymentObject, callback);
```

[API documentation](https://www.mollie.com/en/docs/payments#payment-create)


### payments.list

**( [params], callback )**

List payments in your account.


argument | type     | required | description
:--------|:---------|:---------|:--------------------------------
params   | object   | no       | Pagination, `count` and `offset`
callback | function | yes      | Callback function


```js
// Just recent
mollie.payments.list (callback)

// Specify a set
mollie.payments.list ({ offset: 20, count: 20 }, callback);
```

[API documentation](https://www.mollie.com/en/docs/payments#payment-list)


### payments.get

**( paymentId, callback )**

Get details about one payment

argument  | type     | required | description
:---------|:---------|:---------|:-----------------
paymentId | string   | yes      | Payment `id`
callback  | function | yes      | Callback function


```js
mollie.payments.get ('tr_7UhSN1zuXS', callback);
```

[API documentation](https://www.mollie.com/en/docs/payments#payment-get)


### refunds.create

**( paymentId, [amount], callback)**

Create a refund for a payment


argument  | type     | required | description
:---------|:---------|:---------|:-----------------------------------------
paymentId | string   | yes      | Payment `id`
amount    | number   | no       | Amount to refund, defaults to full amount
callback  | function | yes      | Callback function


```js
mollie.refunds.create ('tr_WDqYK6vllg', 10.95, callback);
```

[API documentation](https://www.mollie.com/en/docs/refunds#refund-create)


### refunds.list

**( paymentId, callback)**

List refunds for a payment.


argument  | type     | required | description
:---------|:---------|:---------|:-----------------
paymentId | string   | yes      | Payment `id`
callback  | function | yes      | Callback function


```js
mollie.refunds.list ('tr_WDqYK6vllg', callback);
```

[API documentation](https://www.mollie.com/en/docs/refunds#list-refunds)


### refunds.delete

**( paymentId, refundId, callback)**

Get details about one refund for a payment.


argument  | type     | required | description
:---------|:---------|:---------|:-----------------
paymentId | string   | yes      | Payment `id`
refundId  | string   | yes      | Refund `id`
callback  | function | yes      | Callback function


```js
mollie.refunds.get ('tr_WDqYK6vllg', 're_4qqhO89gsT', callback);
```

The `data` argument to the _callback_ function is boolean `true` on success.

[API documentation](https://www.mollie.com/en/docs/refunds#refund-delete)


### methods.list

**( [params], callback )**

Get payment methods available to your account.


argument | type     | required | description
:--------|:---------|:---------|:--------------------------------
params   | object   | no       | Pagination, `offset` and `count`
callback | function | yes      | Callback function


```js
mollie.methods.list (callback);
```

[API documentation](https://www.mollie.com/en/docs/methods#methods-list)


### issuers.list

**( [params], callback )**

List issuers for iDeal.


argument | type     | required | description
:--------|:---------|:---------|:--------------------------------
params   | object   | no       | Pagination, `offset` and `count`
callback | function | yes      | Callback function


```js
mollie.issuers.list (callback);
```

[API documentation](https://www.mollie.com/en/docs/issuers#issuers-list)


### issuers.get

**( issuerId, callback )**

Get details about an issuer.


argument | type     | required | description
:--------|:---------|:---------|:-----------------
issuerId | string   | yes      | Issuer `id`
callback | function | yes      | Callback function


```js
mollie.issuers.get ('ideal_ABNANL2A', callback);
```

[API documentation](https://www.mollie.com/en/docs/issuers#issuers-get)


Unlicense
---------

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>


Author
------

Franklin van de Meent
| [Website](https://frankl.in)
| [Github](https://github.com/fvdm)
