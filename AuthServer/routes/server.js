var oauth2orize = require('oauth2orize');
var utils = require('../utils/utils');
var tokenizer = require('../utils/tokenizer');
var predefine = require('./predefine');

var AuthorizeCode = require('../database/authorizecode_schema');
var Token = require('../database/token_schema');
var OauthClient = require('../database/Oauthclient_schema');
var User = require('../database/user_schema');

var server = null;

var initialize = function(){
	// oauth2 제공자를 위한 서버 생성
	if(server){
		console.log('oauth2 server was already initialized');
		return;
	}
	server = oauth2orize.createServer();
	
	server.serializeClient(function(client, done){
		return done(null, client.clientId);
	});
	
	server.deserializeClient(function(id, done){
		OauthClient.findOne({
			'clientId' : id
		}, function(err, client){
			if (err){
				return done(err);
			}
			return done(null, client);
		});
	});
	
	setGrant(server);
	setExchangeToken(server);
};