var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = {};

Schema.createSchema = function(mongoose){
	
	var authorizecodeschema = mongoose.Schema({
		code: {type: String, 'default' :''},
		redirectURI: {type: String, 'default':''},
		clientId: {type: String, 'default': ''},
		userId : {type: String, 'default': ''}
	});
	
	mongoose.model('authorizecode', authorizecodeschema);
	
	console.log('authorizecode Schema 정의함.');
	
	return authorizecodeschema;
};

module.exports = Schema;