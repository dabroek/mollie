/*
Name:          nodejs-mollie
Description:   Node.js module to access the Mollie payments and MessageBird SMS APIs.
Source:        https://github.com/fvdm/nodejs-mollie
Feedback:      https://github.com/fvdm/nodejs-mollie/issues
License:       Public Domain / Unlicense (see UNLICENSE file)
*/

var httpreq = require ('httpreq');
var settings = {
  apikey: null,
  timeout: 5000
};

function talk (method, path, params, callback) {
  var options = {
    url: 'https://api.mollie.nl/v1' + path,
    method: method,
    parameters: params || null,
    timeout: parseInt (settings.timeout, 10) || 5000,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + settings.apikey,
      'User-Agent': 'mollie.js (https://www.npmjs.com/package/mollie)'
    }
  };

  httpreq.doRequest (options, function (err, res) {
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
      data = null;
    }

    callback (error, data);
  });
}


module.exports = function (config) {
  var ckey;

  if (typeof config !== 'object') {
    return null;
  }

  for (ckey in config) {
    settings [ckey] = config [ckey];
  }

  return {
    payments: {
      get: function (id, callback) {
        talk ('GET', '/payments/' + id, {}, callback);
      },

      list: function (params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = {};
        }
        talk ('GET', '/payments', params, callback);
      },

      create: function (params, callback) {
        var key;

        if (params.metadata instanceof Object) {
          for (key in params.metadata) {
            params ['metadata[' + key + ']'] = params.metadata [key];
          }

          delete params.metadata;
        }

        talk ('POST', '/payments', params, callback);
      }
    },

    refunds: {
      list: function (paymentId, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = {};
        }
        talk ('GET', '/payments/' + paymentId + '/refunds', params, callback);
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

        talk ('POST', '/payments/' + paymentId + '/refunds', params, callback);
      },

      delete: function (paymentId, refundId, callback) {
        talk ('DELETE', '/payments/' + paymentId + '/refunds/' + refundId, {}, callback);
      }
    },

    issuers: {
      get: function (issuerId, callback) {
        talk ('GET', '/issuers/' + issuerId, {}, callback);
      },

      list: function (params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = {};
        }
        talk ('GET', '/issuers', params, callback);
      }
    },

    methods: {
      list: function (params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = {};
        }
        talk ('GET', '/methods', params, callback);
      }
    }
  };
};

