/*
Name:           mollie - test.js
Description:    Node.js module to access the Mollie payments API
Author:         Franklin van de Meent (https://frankl.in)
Source & docs:  https://github.com/fvdm/nodejs-mollie
Feedback:       https://github.com/fvdm/nodejs-mollie/issues
License:        Unlicense (Public Domain, see UNLICENSE file)
*/

var dotest = require ('dotest');
var app = require ('./');


// Setup
// $ env MOLLIE_APIKEY=secret npm test
var timeout = process.env.MOLLIE_TIMEOUT || 5000;
var apikey = process.env.MOLLIE_APIKEY || '';
var keytype = apikey.match (/^test_/) ? 'test' : 'live';

var mollie = app ({
  apikey: apikey,
  timeout: timeout
});

var cache = {
  payment: {
    mode: 'test',
    amount: 12.34,
    description: 'Order #112233',
    redirectUrl: 'https://mywebshop.tld/order/112233',
    metadata: {
      order_id: 112233
    }
  }
};


dotest.add ('API key', function (test) {
  test ()
    .info ('Using a ' + keytype.toUpperCase () + ' key')
    .isNotEmpty ('fail', 'MOLLIE_APIKEY', apikey)
    .done ();

  if (!apikey) {
    dotest.exit ();
  }
});


dotest.add ('Module', function (test) {
  var payments = mollie && mollie.payments;
  var refunds = mollie && mollie.refunds;
  var methods = mollie && mollie.methods;

  test ()
    .isFunction ('fail', 'exports', app)
    .isObject ('fail', 'module', mollie)
    .isObject ('fail', '.payments', mollie.payments)
    .isFunction ('fail', '.payments.create', payments && payments.create)
    .isFunction ('fail', '.payments.list', payments && payments.list)
    .isFunction ('fail', '.payments.get', payments && payments.get)
    .isObject ('fail', '.refunds', mollie.refunds)
    .isFunction ('fail', '.refunds.create', refunds && refunds.create)
    .isFunction ('fail', '.refunds.list', refunds && refunds.list)
    .isFunction ('fail', '.refunds.delete', refunds && refunds.delete)
    .isObject ('fail', '.methods', mollie.methods)
    .isFunction ('fail', '.methods.list', methods && methods.list)
    .done ();
});


dotest.add ('payments.create', function (test) {
  mollie.payments.create (cache.payment, function (err, data) {
    cache.payment = data;

    test (err)
      .isObject ('fail', 'data', data)
      .done ();
  });
});


dotest.add ('payments.list - normal', function (test) {
  mollie.payments.list (function (err, data) {
    var item = data && data.data && data.data [0];

    test (err)
      .isObject ('fail', 'data', data)
      .isArray ('fail', 'data.data', data.data)
      .isObject ('fail', 'data.data[0]', item)
      .done ();
  });
});


dotest.add ('payments.list - option', function (test) {
  mollie.payments.list ({ offset: 0, count: 10 }, function (err, data) {
    var item = data && data.data && data.data [0];

    test (err)
      .isObject ('fail', 'data', data)
      .isArray ('fail', 'data.data', data.data)
      .isObject ('fail', 'data.data[0]', item)
      .done ();
  });
});


dotest.add ('payments.get', function (test) {
  mollie.payments.get (cache.payment.id, function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .done ()#
  });
});


dotest.add ('refunds.create - normal', function (test) {
  mollie.refunds.create (cache.payment.id, function (err, data) {
    if (keytype === 'live') {
      cache.refund = data;
      test (err)
        .isObject ('fail', 'data', data)
        .done ();
    } else {
      test ()
        .isError ('fail', 'err', err)
        .isExactly ('fail', 'err.message', err && err.message, 'API error')
        .isExactly ('fail', 'err.statusCode', err && err.statusCode, 422)
        .isObject ('fail', 'err.error', err && err.error)
        .done ();
    }
  });
});


dotest.add ('refunds.create - option', function (test) {
  mollie.refunds.create (cache.payment.id, 5, function (err, data) {
    if (keytype === 'live') {
      cache.refund = data;
      test (err)
        .isObject ('fail', 'data', data)
        .done ();
    } else {
      test ()
        .isError ('fail', 'err', err)
        .isExactly ('fail', 'err.message', err && err.message, 'API error')
        .isExactly ('fail', 'err.statusCode', err && err.statusCode, 422)
        .isObject ('fail', 'err.error', err && err.error)
        .done ();
    }
  });
});


dotest.add ('refunds.list - normal', function (test) {
  mollie.refunds.list (cache.payment.id, function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .isArray ('fail', 'data.data', data && data.data)
      .done ();
  });
});


dotest.add ('refunds.list - option', function (test) {
  mollie.refunds.list (cache.payment.id, { offset: 0, count: 10 }, function (err, data) {
    test (err)
      .isObject ('fail', 'data', data)
      .isArray ('fail', 'data.data', data && data.data)
      .done ();
  });
});


dotest.add ('refunds.delete', function (test) {
  if (keytype === 'live') {
    mollie.refunds.delete (cache.payment.id, cache.refund.id, function (err, data) {
      test (err)
        .isExactly ('fail', 'data', data, true)
        .done ();
    });
  } else {
    mollie.refunds.delete (cache.payment.id, 1, function (err, data) {
      test (err)
        .isExactly ('fail', 'data', data, false)
        .done ();
      ]);
    });
  }
});


dotest.add ('methods.list - normal', function (test) {
  mollie.methods.list (function (err, data) {
    var item = data && data.data && data.data [0];

    test (err)
      .isObject ('fail', 'type', data)
      .isArray ('fail', 'data.data', data.data)
      .isObject ('fail', 'data.data[0]', item)
      .done ();
  });
});


dotest.add ('methods.list - option', function (test) {
  mollie.methods.list ({ offset: 0, count: 10 }, function (err, data) {
    test (err)
      .isObject ('fail', 'type', data)
      .isArray ('fail', 'data.data', data.data)
      .isObject ('fail', 'data.data[0]', item)
      .done ();
  });
});


// Start the tests
dotest.run ();
