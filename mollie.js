/*
Name:          nodejs-mollie
Description:   Node.js module to access the Mollie payments and MessageBird SMS APIs.
Source:        https://github.com/fvdm/nodejs-mollie
Feedback:      https://github.com/fvdm/nodejs-mollie/issues
License:       Public Domain / Unlicense (see UNLICENSE file)
*/

var httpreq = require ('httpreq');

function talk (method, path, params, callback) {
  var options = {
    url: 'https://api.mollie.nl/v1' + path,
    method: method,
    parameters: params || null,
    timeout: parseInt (this.config.timeout, 10) || 5000,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + this.config.apikey,
      'User-Agent': 'mollie.js (https://www.npmjs.com/package/mollie)'
    }
  };

  httpreq.doRequest (options, function (err, res) {
    var data = res && res.body || null;
    var error = null;

    if (err) {
      error = new Error ('request failed');
      error.error = err;
    } else {
      try {
        data = JSON.parse (data);

        if (data.error) {
          error = new Error ('API error');
          error.error = data.error;
          data = null;
        }
      } catch (e) {
        error = new Error ('invalid response');
        error.error = e;
      }
    }

    if (method === 'DELETE' && res && res.statusCode === 204) {
      error = null;
      data = true;
    }

    if (error) {
      error.statusCode = res && res.statusCode || null;
      error.headers = res && res.headers || {};
    }

    callback (error, data);
  });
}

function fixcbparams () {
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }
}


var Mollie = function (config) {
  this.config = config || {};
  this.talk = talk;

  this.payments = {
    get: function (id, callback) {
      this.talk ('GET', '/payments/' + id, {}, callback);
    },

    list: function (params, callback) {
      fixcbparams ();
      this.talk ('GET', '/payments', params, callback);
    },

    create: function (params, callback) {
      this.talk ('POST', '/payments', params, callback);
    }
  };

  this.refunds = {
    list: function (paymentId, params, callback) {
      fixcbparams ();
      this.talk ('GET', '/payments/' + paymentId + '/refunds', params, callback);
    },

    create: function (paymentId, params, callback) {
      fixcbparams ();
      this.talk ('POST', '/payments/' + paymentId + '/refunds', params, callback);
    },

    delete: function (paymentId, refundId, callback) {
      this.talk ('DELETE', '/payments/' + paymentId + '/refunds/' + refundId, {}, callback);
    }
  };

  this.issuers = {
    get: function (issuerId, callback) {
      this.talk ('GET', '/issuers/' + issuerId, {}, callback);
    },

    list: function (params, callback) {
      fixcbparams ();
      this.talk ('GET', '/issuers', params, callback);
    }
  };

  this.methods = function (params, callback) {
    fixcbparams ();
    this.talk ('GET', '/methods', params, callback);
  };
};

module.exports = Mollie;
