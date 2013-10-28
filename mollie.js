/*
Name:          nodejs-mollie
Description:   Node.js module to access the Mollie payments and MessageBird SMS APIs.
Source:        https://github.com/fvdm/nodejs-mollie
Feedback:      https://github.com/fvdm/nodejs-mollie/issues
License:       Public Domain / Unlicense (see UNLICENSE file)
*/

// MODULE

var mollie = {}
var https = require('https')
var querystring = require('querystring')
var xml2json = require('node-xml2json')

mollie.api = {
	partnerid:	0,
	username:	'',
	password: 	''
}


// Account credits
mollie.credits = function( callback ) {
	mollie.talk(
		'credits',
		{
			username:	mollie.api.username,
			password:	mollie.api.password
		},
		callback
	)
}


// HLR-lookup (Network Query)
// https://www.mollie.nl/beheer/sms-diensten/documentatie/hlr/
// Codes: http://en.wikipedia.org/wiki/Mobile_Network_Code
mollie.hlr = function( vars, callback ) {
	vars.username = mollie.api.username
	vars.password = mollie.api.password
	mollie.talk( 'hlr', vars, callback )
}


// SMS
// Normal: https://www.mollie.nl/beheer/sms-diensten/documentatie/sms/http/
// Premium: https://www.mollie.nl/beheer/sms-diensten/documentatie/sms/http/?s=premium
mollie.sms = function( vars, callback ) {
	vars.username = mollie.api.username
	vars.password = mollie.api.password
	mollie.talk( 'sms', vars, callback )
}


// Phone / IVR / 090x
// https://www.mollie.nl/beheer/betaaldiensten/documentatie/ivr/
mollie.ivr = {
	
	// payment
	payment: function( vars, callback ) {
		
		vars.a = 'fetch'
		vars.partnerid = mollie.api.partnerid
		mollie.talk( 'micropayment', vars, callback )
		
	},
	
	// check
	check: function( vars, callback ) {
		
		vars.a = 'check'
		mollie.talk( 'micropayment', vars, callback )
		
	}
	
}



// paysafecard
// https://www.mollie.nl/beheer/betaaldiensten/documentatie/paysafecard/
mollie.paysafecard = {
	
	// prepare
	prepare: function( vars, callback ) {
		
		vars.partnerid = mollie.api.partnerid
		
		// fix centen
		if( typeof vars.amount === 'string' && vars.amount.indexOf('.') ) {
			var asplit = vars.amount.split('.')
			if( asplit[1] !== undefined ) {
				vars.amount = vars.amount * 100
			}
		}
		
		mollie.talk( 'paysafecard/prepare', vars, callback )
		
	},
	
	
	// status
	status: function( vars, callback ) {
		vars.partnerid = mollie.api.partnerid
		mollie.talk( 'paysafecard/check-status', vars, callback )
	}
	
}


// iDEAL
// https://www.mollie.nl/beheer/betaaldiensten/documentatie/ideal/
mollie.ideal = {
	
	// link
	paymentLink: function( vars, callback ) {
		
		vars = typeof vars !== 'object' ? {} : vars
		vars.a = 'create-link'
		vars.partnerid = mollie.api.partnerid
		
		// fix centen
		if( typeof vars.amount == 'string' && vars.amount.indexOf('.') ) {
			var asplit = vars.amount.split('.')
			if( asplit[1] !== undefined ) {
				vars.amount = vars.amount * 100
			}
		}
		
		// post
		mollie.talk( 'ideal', vars, callback )
		
	},
	
	
	// payment
	payment: function( vars, callback ) {
		
		vars = typeof vars !== 'object' ? {} : vars
		vars.a = 'fetch'
		vars.partnerid = mollie.api.partnerid
		
		// fix centen
		if( typeof vars.amount == 'string' && vars.amount.indexOf('.') ) {
			var asplit = vars.amount.split('.')
			if( asplit[1] !== undefined ) {
				vars.amount = vars.amount * 100
			}
		}
		
		// post
		mollie.talk( 'ideal', vars, callback )
		
	},
	
	
	// check
	check: function( vars, callback ) {
		
		vars = typeof vars !== 'object' ? {} : vars
		vars.a = 'check'
		vars.partnerid = mollie.api.partnerid
		
		// fix testmode
		if( vars.testmode !== undefined ) {
			vars.testmode = vars.testmode === true || vars.testmode === 'true' ? 'true' : 'false'
		}
		
		// request
		mollie.talk( 'ideal', vars, callback )
		
	},
	
	// banklist
	banklist: function( testmode, callback ) {
		
		// fix callback
		if( callback === undefined ) {
			var callback = testmode
			testmode = -1
		}
		
		// vars
		var vars = {
			a: 'banklist'
		}
		
		if( testmode !== -1 ) {
			vars.testmode = testmode ? 'true' : 'false'
		}
		
		// request
		mollie.talk( 'ideal', vars, function( res ) {
			var banks = {}
			if( typeof res === 'object' && typeof res.bank === 'object' ) {
				if( res.bank.bank_id === undefined ) {
					for( var b in res.bank ) {
						bank = res.bank[b]
						banks[ bank.bank_id ] = bank
					}
				}
				else
				{
					banks[ res.bank.bank_id ] = res.bank
				}
			}
			callback( banks )
		})
		
	}
	
}


// talk
mollie.talk = function( path, fields, callback ) {
	
	// fix input
	if( typeof fields === 'function' ) {
		var callback = fields
		var fields = {}
	}
	
	// prevent multiple callbacks
	var complete = false
	function doCallback( err, res ) {
		if( ! complete ) {
			complete = true
			callback( err, res )
		}
	}
	
	// query string
	var query = typeof fields === 'object' ? querystring.stringify( fields ) : ''
	
	// build request
	var options = {
		host: 'www.mollie.nl',
		port: 443,
		path: '/xml/'+ path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': query.length
		}
	}
	
	var request = https.request( options )
	
	// response
	request.on( 'response', function( response ) {
		var data = []
		var size = 0
		
		response.on( 'data', function( chunk ) {
			data.push(chunk)
			size += chunk.length
		})
		
		response.on( 'end', function() {
			var error = null
			
			// combine chunks
			var buf = new Buffer(size)
			var pos = 0
			for( var d in data ) {
				data[d].copy( buf, pos )
				pos += data[d].length
			}
			
			data = data.toString('utf8').trim()
			
			// process response
			if( data === '' ) {
				error = new Error('no response data')
			} else {
				data = xml2json.parser( data.trim() )
				data = data.response
				if( data.item !== undefined ) {
					data = data.item
				}
				
				// catch API errors
				if( data.resultcode > 10 ) {
					error = new Error('API error')
					error.code = data.resultcode
					error.error = data.resultmessage
				}
			}
			
			// return result
			doCallback( error, data )
		})
	})
	
	// post and close
	request.end( query )
	
}

// ready
module.exports = mollie