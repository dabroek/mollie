/*
Name:           mollie - test.js
Author:         Franklin van de Meent (https://frankl.in)
Source & docs:  https://github.com/fvdm/nodejs-mollie
Feedback:       https://github.com/fvdm/nodejs-mollie/issues
License:        Unlicense (Public Domain, see UNLICENSE file)
*/

// Setup
// $ env MOLLIE_APIKEY=secret npm test
var mollie = require ('./') ({
  apikey: process.env.MOLLIE_APIKEY || null,
  timeout: process.env.MOLLIE_TIMEOUT || 5000
});

var errors = 0;
var queue = [];
var next = 0;


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
  console.error (err.stack);
  console.trace ();
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
  mollie.methods.list (function (err, res) {
    doTest (err, 'methods.list', [
      ['type', res instanceof Object],
      ['data', res && res.data instanceof Object]
    ]);
  });
});


// Start the tests
console.log ('Running tests...\n');
queue [0] ();
