
/*
 * 설정
 */

module.exports = {
	server_port: 3002,
	db_url: 'mongodb://192.168.0.13:27017/shopping',
	db_schemas: [
	    {file:'./user_schema', collection:'oauth1', schemaName:'UserSchema', modelName:'UserModel'},
	    {file:'./token_schema', collection:'oauth2', schemaName: 'tokenSchema', modelName:'tokenModel' },
	    {file:'./Oauthclient_schema', collection:'oauth3', schemaName: 'oauthschema', modelName:'oauthClientModel'},
	    {file:'./authorizecode_schema', collection:'oauth4', schemaName: 'authorizecodeschema', modelName:'authorizecodeModel'},
	],
	route_info: [
		{file : './index', path : '/index/test',method : 'index', type : 'post'}
	],
	facebook: {		// passport facebook
		clientID: '1442860336022433',
		clientSecret: '13a40d84eb35f9f071b8f09de10ee734',
		callbackURL: 'http://localhost:3000/auth/facebook/callback'
	},
	twitter: {		// passport twitter
		clientID: 'id',
		clientSecret: 'secret',
		callbackURL: '/auth/twitter/callback'
	},
	google: {		// passport google
		clientID: 'id',
		clientSecret: 'secret',
		callbackURL: '/auth/google/callback'
	},
};