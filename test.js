/*
Name:           mollie - test.js
Author:         Franklin van de Meent (https://frankl.in)
Source & docs:  https://github.com/fvdm/nodejs-mollie
Feedback:       https://github.com/fvdm/nodejs-mollie/issues
License:        Unlicense (Public Domain, see UNLICENSE file)
*/

// Setup
// $ env MOLLIE_APIKEY=secret npm test
var pkg = require ('./package.json');
var Mollie = require ('./');
var mollie;
var timeout = process.env.MOLLIE_TIMEOUT || 5000;
var apikey = process.env.MOLLIE_APIKEY || '';

var keytype;
var errors = 0;
var queue = [];
var next = 0;

var cache = {
  payment: {
    amount: 12.34,
    description: 'Order #112233',
    redirectUrl: 'https://mywebshop.tld/order/112233',
    metadata: {
      order_id: 112233
    }
  }
};


// handle exits
process.on ('exit', function () {
  if (errors === 0) {
    console.log ('\n\u001b[1mDONE, no errors.\u001b[0m\n');
    process.exit (0);
  } else {
    console.log ('\n\u001b[1mFAIL, ' + errors + ' error' + (errors > 1 ? 's' : '') + ' occurred!\u001b[0m\n');
    process.exit (1);
  }
});

// prevent errors from killing the process
process.on ('uncaughtException', function (err) {
  console.log ();
  console.error (err);
  console.log ();
  errors++;
});

// Queue to prevent flooding
function doNext () {
  next++;
  if (queue [next]) {
    queue [next] ();
  }
}

// doTest( passErr, 'methods', [
//   ['feeds', typeof feeds === 'object']
// ])
function doTest (err, label, tests) {
  var testErrors = [];
  var i;

  if (err instanceof Error) {
    console.error ('\u001b[1m\u001b[31mERROR\u001b[0m - ' + label + '\n');
    console.dir (err, { depth: null, colors: true });
    console.log ();
    console.error (err.stack);
    console.log ();
    errors++;
  } else {
    for (i = 0; i < tests.length; i++) {
      if (tests [i] [1] !== true) {
        testErrors.push (tests [i] [0]);
        errors++;
      }
    }

    if (testErrors.length === 0) {
      console.log ('\u001b[1m\u001b[32mgood\u001b[0m - ' + label);
    } else {
      console.error ('\u001b[1m\u001b[31mFAIL\u001b[0m - ' + label + ' (' + testErrors.join (', ') + ')');
    }
  }

  doNext ();
}


queue.push (function () {
  mollie.payments.create (cache.payment, function (err, data) {
    if (data) {
      cache.payment = data;
    }

    doTest (err, 'payments.create', [
      ['type', data instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.payments.list (function (err, data) {
    doTest (err, 'payments.list normal', [
      ['type', data instanceof Object],
      ['data', data && data.data instanceof Array],
      ['item', data && data.data && data.data [0] instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.payments.list ({ offset: 0, count: 10 }, function (err, data) {
    doTest (err, 'payments.list option', [
      ['type', data instanceof Object],
      ['data', data && data.data instanceof Array],
      ['item', data && data.data && data.data [0] instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.payments.get (cache.payment.id, function (err, data) {
    doTest (err, 'payments.get', [
      ['type', data instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.refunds.create (cache.payment.id, 5, function (err, data) {
    cache.refund = data;
    doTest (err, 'refunds.create option', [
      ['type', data instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.refunds.create (cache.payment.id, function (err, data) {
    cache.refund = data;
    doTest (err, 'refunds.create normal', [
      ['type', data instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.refunds.list (cache.payment.id, function (err, data) {
    doTest (err, 'refunds.list normal', [
      ['type', data instanceof Object],
      ['data', data && data.data instanceof Array],
      ['item', data && data.data && data.data [0] instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.refunds.list ({ offset: 0, count: 10 }, function (err, data) {
    doTest (err, 'refunds.list option', [
      ['type', data instanceof Object],
      ['data', data && data.data instanceof Array],
      ['item', data && data.data && data.data [0] instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.refunds.delete (cache.payment.id, cache.refund.id, function (err, data) {
    doTest (err, 'refunds.delete', [
      ['type', typeof data === 'boolean'],
      ['data', data === true]
    ]);
  });
});


queue.push (function () {
  mollie.methods.list (function (err, data) {
    doTest (err, 'methods.list', [
      ['type', data instanceof Object],
      ['data', data && data.data instanceof Array],
      ['item', data && data.data && data.data [0] instanceof Object]
    ]);
  });
});


queue.push (function () {
  mollie.methods.list (function (err, data) {
    doTest (err, 'methods.list', [
      ['type', data instanceof Object],
      ['data', data && data.data instanceof Array],
      ['item', data && data.data && data.data [0] instanceof Object]
    ]);
  });
});


// Start the tests
console.log ('Running tests...');
console.log ('Node.js v' + process.versions.node);
console.log ('Module  v' + pkg.version);
console.log ();

if (apikey === '') {
  console.log ('\u001b[1m\u001b[31mFAIL\u001b[0m - MOLLIE_APIKEY not set');
} else {
  apikey.replace (/^(live|test)_/, function (s, type) {
    keytype = type;
  });

  console.log ('Using a ' + keytype.toUpperCase () + ' apikey');

  mollie = Mollie ({
    apikey: apikey,
    timeout: timeout
  });
}

console.log ();
queue [0] ();
