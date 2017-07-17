var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var utils = require('../utils/utils');

var Schema = {};

Schema.createSchema = function(mongoose){
	
	var oauthschema = mongoose.Schema({
		name : {type: String, 'default':''},
		clientId: {type: String, 'default': ''},
		clientSecret: {type: String, 'default' : ''},
		redirectURI: {type: String, 'default' : ''},
		// grant_type is 4
		// 'authorization_code', ('implicit',) 'password', 'client_credentials'
		// first item : grant_type string
		// second item : is it possible to refresh token
		grantType: {type: [String, Boolean], 'default' :''}
	});
	
	oauthschema.pre('save', function(next){
		if(!this.isNew){
			return next();
		}
		if(!this.clientId){
			this.clientId = utils.uid(16);
		}
		if(!this.clientSecret){
			this.clientSecret = utils.uid(32);
		}
		next();
	});
	
	mongoose.model('OauthClient', oauthschema);
	
	console.log('Oauthclient Schema 정의함.');
	
	return oauthschema;
};

module.exports = Schema;