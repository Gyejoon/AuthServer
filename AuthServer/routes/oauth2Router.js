var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var PublicClientStrategy = require('passport-oauth2-public-cleint').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var oauth2orize = require('oauth2orize');
var oauth2Server = require('./server');
var oauth2TestClients = require('./test-clients');
var predefine = require('../authentication/predefine');
var OauthClient = require('../database/Oauthclient_schema');
var User = require('../database/user_schema');
var Token = require('../database/token_schema');
var tokenizer = require('../utils/tokenizer');
var url = require('url');
var querystring = require('querystring');


var initialize = function(app){
	oauth2Server.initialize();
	oauth2TestClients();
	
	setPassportStrategy();
	setRouter(app);
};

var setPassportStrategy = function(){
	/*  두가지 인증 유형에 대해서만 클라이언트 자격 증명을 복구합니다. 
		승인 코드 부여 유형
		리소스 소유자 자격 증명 암호 유형
		클라이언트 인증 정보 허용
	 */
	// 이 요청은 클라이언트 비밀을 안전하게 유지할 수 있는 타사 앱의 백엔드 서버에 의해 수행됩니다.
	// 액세스 토큰을 가져오려면 타사 앱의 백엔드 서버가 클라이언트 ID와 비밀 번호를 포함하는 http헤더의 '권한 부여 기본'을 기반으로 보조를 요청해야 합니다.
	passport.use(new BasicStrategy({
		passReqToCallback: true
	}, function(req, clientId, clientSecret, done){
		console.log('enter basic strategy');
		if(!req.body.grant_type){
			var error = new oauth2orize.TokenError(
				'there is no grant_type field in body',
				'invalid_request');
			return done(error);
		}
		
		switch(req.body.grant_type){
			case predefine.oauth2.type.authorizationCode.name:
			case predefine.oauth2.type.password.name:
			case predefine.oauth2.type.clientCredentials.name:
				break;
			default:
				var errors = new oauth2orize.TokenError(
					'This client cannot be used for ' + req.body.grant_type,
					'unsupported_grant_type');
				return done(errors);
		}
		
		// 클라이언트 자격 증명 확인
		OauthClient.findOne({
			clientId: clientId,
			clientSecret: clientSecret
		}, function(err, oauthClient){
			if(err){
				var error = new oauth2orize.TokenError(
					'server error during validating client credential',
					'server_error');
				return done(error);
			}
			
			if(oauthClient === null){
				// 이 에러는 oauth2orize에 의해 handle될 것이다.
				var errors = new oauth2orize.TokenError(
					'Client authentication failed',
					'invalid_client');
				return done(errors);
			}
			if(oauthClient.grantType[0] !== req.body.grant_type){
				done(new oauth2orize.TokenError(
					'This client cannot be used for ' + req.body.grant_type,
					'unsupported_grant_type'));
			}
			return done(null, oauthClient);
		});
	}));
	
	passport.use(new PublicClientStrategy({
		passReqToCallback: true	
	}, function(req, clientId, done){
		console.log('enter public client strategy');
		switch(req.body.grant_type){
			case predefine.oauth2.type.clientCredentials.name:
				OauthClient.findOne({
					clientId: req.body.client_id
				}, function(err, oauthClient){
					if(err){
						return done(new oauth2orize.TokenError(
							'Error occurs during finding client',
							'server_error'));
					}
					
					if(!oauthClient){
						return done(new oauth2orize.TokenError(
							'This client does not exist',
							'invalid_client'));
					}
					
					if(oauthClient.grantType[0] !== req.body.grant_type){
						return done(new oauth2orize.TokenError(
							'This client cannot be used for ' + req.body.grant_type,
							'unsupported_grant_type'));
					}
					// 만약 에러가 없다면 oauth2 실행은 계속된다.
					return done(null, oauthClient);
				});
				break;
			default:
				// 이 에러는 oauth2orize에 의해 handled될것이다.
				var err = new oauth2orize.TokenError(
						req.body.grant_type + ' type is not supported',
						'unsupported_grant_type');
				return done(err);
		}
	}));
	
	passport.use(new BearerStrategy({
		passReqToCallback: true
	}, function(req, accessToken, done){
		console.log('bearer strategy');
		tokenizer.validate(accessToken, function(err, token){
			if(err){
				return done(err);
			}
			
			User.findOne({
				'_id': token.userId
			}, function(err, user){
				if(err){
					return done(err);
				}
				if(!user){
					return done(null, false, {
						reason: 'invalid-user'
					});
				}
				
				// 토큰 정보는 REST API를 위해 사용될 수 있다.
				// 따라서 토큰 정보가 인증 후 반환되도록 설정된다.
				user.tokenInfo = token;
				return done(null, user);
			});
		});
	}));
};

var setRouter = function(router){
	// 승인 코드를 위한 implicit 허용 타입
	router.get('/oauth2/authorize', isLogined, oauth2Server.authorize());
	router.post('/oauth2/authorize/decision', isLogined, oauth2Server.decision());
	
	// 인증 클라이언트와 제어 토큰을 생성한다.
	// 'basic' 방식 : 'authorization code', 'client Credential' 허용 타입
	// 'public-client' 방식 : 'Implicit', 'Resource owner password' 타입
	router.post('/oauth2/token',
			function(req, res, next){
				console.log('session: ' + JSON.stringify(req.session));
				next();
			},
			passport.authenticate(
				['basic', 'oauth2-public-client'],
				{ session : false }),
			oauth2Server.token());
	
	// 모든 허용 타입을 위한 제어 토큰 삭제 
	router.del('/oauth2/token',
			passport.authenticate('bearer', {session: false}),
			function(req, res){
				console.log('bearer strategy for token delete');
				Token.remove({
					'accessToken': req.user.tokenInfo.accessToken,
					'userId': req.user._id
				}, function(err){
					if(err){
						res.send(400);
					} else {
						res.send(200);
					}
				});
		});
	
	// 제 3자의 인증에 사용된다.
	// 오류가 없는 경우 이 타사 앱 서버는 수신 코드를 사용하여 토큰을 교환해야 한다.
	// 그렇지 않으면 타사 앱 서버가 오류 유형에 따라 오류를 처리해야 한다.
	router.get('/oauth2/authorize/callback', function (req, res){
		console.log('Redirected by authorization server');
		var ret = {};
		if(req.query.code){
			ret.code = req.query.code;
			ret.state = req.query.state;
		} else if (req.query.access_token){
			ret.access_token = req.query.access_token;
			ret.refresh_token = req.query.refresh_token;
			ret.expires_in = req.query.expires_in;
			ret.scope = req.query.scope;
			ret.state = req.query.state;
			ret.token_type = req.qery.token_type;
		} else if(req.query.error){
			ret.error = req.query.error;
			ret.error_description = req.query.error_description;
			ret.error_uri = req.query.error_uri;
		} else {
			console.log('invalid callback');
		}
		console.log('req url : ' + req.originalUrl);
		
		// 이 전송은 의미가 없다. 단지 마감 응답만을 위한 것이다.
		res.json(ret);
	});
	
	
};

var isLogined = function(req, res, next){
		if(req.isAuthenticated()){
			return next();
		}
		
		// 이 에러는 oauth2orize에 의해 handled될 것이다.
		var error = new oauth2orize.TokenError(
				'authorization server denied this request',
				'access_denied');
		return next(error);
};

module.exports.initialize = initialize;