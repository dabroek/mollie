/*
Name:          nodejs-mollie
Description:   Node.js module to access the Mollie payments and MessageBird SMS APIs.
Source:        https://github.com/fvdm/nodejs-mollie
Feedback:      https://github.com/fvdm/nodejs-mollie/issues
License:       Public Domain / Unlicense (see UNLICENSE file)
*/

var httpreq = require ('httpreq');

function httpResponse (err, res, callback) {
  var data = res && res.body || null;
  var error = null;

  if (err) {
    error = new Error ('request failed');
    error.error = err;
    callback (error);
    return;
  }

  if (res && res.statusCode === 204) {
    callback (null, true);
    return;
  }

  try {
    data = JSON.parse (data);
  } catch (e) {
    error = new Error ('invalid response');
    error.error = e;
  }

  if (data && data.error) {
    error = new Error ('API error');
    error.error = data.error;
    error.statusCode = res && res.statusCode || null;
    error.headers = res && res.headers || {};
    data = null;
  }

  callback (error, data);
}


function httpRequest (method, path, params, callback) {
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
    httpResponse (err, res || null, callback);
  });
}


module.exports = function (config) {
  this.config = config || {};
  this.httpRequest = httpRequest;

  this.payments = {
    get: function (id, callback) {
      this.httpRequest ('GET', '/payments/' + id, {}, callback);
    },

    list: function (params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      this.httpRequest ('GET', '/payments', params, callback);
    },

    create: function (params, callback) {
      this.httpRequest ('POST', '/payments', params, callback);
    }
  };

  this.refunds = {
    list: function (paymentId, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      this.httpRequest ('GET', '/payments/' + paymentId + '/refunds', params, callback);
    },

    create: function (paymentId, amount, callback) {
      var params = {};

      if (typeof amount === 'function') {
        callback = amount;
        amount = null;
      }

      if (amount) {
        params.amount = amount;
      }

      this.httpRequest ('POST', '/payments/' + paymentId + '/refunds', params, callback);
    },

    delete: function (paymentId, refundId, callback) {
      this.httpRequest ('DELETE', '/payments/' + paymentId + '/refunds/' + refundId, {}, callback);
    }
  };

  this.issuers = {
    get: function (issuerId, callback) {
      this.httpRequest ('GET', '/issuers/' + issuerId, {}, callback);
    },

    list: function (params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      this.httpRequest ('GET', '/issuers', params, callback);
    }
  };

  this.methods = function (params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }
    this.httpRequest ('GET', '/methods', params, callback);
  };
};

