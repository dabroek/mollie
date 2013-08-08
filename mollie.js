/*
	nodejs-mollie
	
	An unofficial Node.js module to access the Mollie API
	
	This code is COPYLEFT meaning you can do with it anything you
	like, except copyrighting it. It would be nice to refer back
	to the source:
	
	https://github.com/fvdm/nodejs-mollie/
*/

// MODULE

var	https = require('https'),
	EventEmitter = require('events').EventEmitter,
	querystring = require('querystring'),
	xml2json = require('node-xml2json')

var mollie = new EventEmitter()

mollie.api = {
	partnerid:	0,
	username:	'',
	password: 	''
}

// Mollie sends bank id's in four digits with zero padding
// and xml2json sees that as oct numbers. Here's a quick fix:
function fixBankId(invalid_bank_id) {
	result = parseInt(invalid_bank_id.toString(8),10)
	result = result.toString()
	while( result.length < 4 )
		result = "0" + result
	return result
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
		if( typeof vars.amount == 'string' && vars.amount.indexOf('.') ) {
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
		
		vars = typeof vars != 'object' ? {} : vars
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
		
		vars = typeof vars != 'object' ? {} : vars
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
		
		vars = typeof vars != 'object' ? {} : vars
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
			if( typeof res == 'object' && typeof res.bank == 'object' ) {
				if( res.bank.bank_id === undefined ) {
					for( var b in res.bank ) {
						bank = res.bank[b]
						// Mollie sends bank id's in four digits with zero padding
						// and xml2json sees that as oct numbers. Here's a quick fix:
						bank.bank_id = fixBankId( bank.bank_id )
						banks[ bank.bank_id ] = bank
					}
				}
				else
				{
					// Mollie sends bank id's in four digits with zero padding
					// and xml2json sees that as oct numbers. Here's a quick fix:
					res.bank.bank_id = fixBankId( res.bank.bank_id )
					banks[ res.bank.bank_id ] = res.bank
				}
			}
			callback( banks )
		})
		
	}
	
}


// talk
mollie.talk = function( path, fields, callback ) {
	
	if( !callback && typeof fields == 'function' ) {
		// fix callback
		var callback = fields;
	} else if( typeof fields == 'object' ) {
		// query string
		var query = Object.keys(fields).length > 0 ? querystring.stringify( fields ) : ''
	}
	
	var query = query ? query : ''
	
	// build request
	var req = https.request(
		{
			host:		'www.mollie.nl',
			port:		443,
			path:		'/xml/'+ path,
			method:		'POST',
			headers:	{
				'Content-Type':		'application/x-www-form-urlencoded',
				'Content-Length':	query.length
			},
			agent:		false
		},
		
		// response
		function( response ) {
			
			// response
			response.setEncoding('utf8')
			var data = ''
			
			response.on( 'data', function( chunk ) { data += chunk });
			response.on( 'end', function() {
				data = xml2json.parser( data )
				data = data.response
				if( data.item != undefined ) {
					data = data.item
				}
				callback( data )
			});
			
		}
	)
	
	// post and close
	req.write( query )
	req.end()
	
}

// ready
module.exports = mollie