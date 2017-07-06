var oauth2orize = require('oauth2orize');
var Token = require('../database/token_schema');
var utils = require('./utils');

var createToken = function(clientId, userId, grantType, cb){
	var token = new Token();
	token.accessToken = utils.uid(256);
	if(grantType.token_refreshable){
		token.refreshToken = utils.uid(256);
	}
	token.expiredIn = grantType.token_duration;
	token.clientId = clientId;
	token.userId = userId;
	token.save(function (err){
		if(err){
			return cb(err);
		}
		return cb(err, token);
	});
};

var refreshToken = function(token, cb){
	// 올바르지 않은 토큰일 경우 에러값 리턴
	if(!token){
		return cb(new Error());
	}
	
	// access token 재생성
	token.accsstoken = utils.uid(256);
	token.createdTime = Date.now();
	
	// DB의 클라이언트 ID와 userID와 refreshToken 갱신
	Token.update({
		clientId : token.clientId,
		userId : token.userId,
		refreshToken : token.refreshToken
	}, {
		accessToken : token.accessToken,
		createdTime : token.createdTime
	}, function(err, result){
		if(err){
			return cb(new Error());
		}
		return cb(err, token);
	});
};

// 유효성 토큰
var validateToken = function (accessToken, cb){
	if(!accessToken){
		return cb(new oauth2orize.TokenError(
				'access token is not given',
				'invalid_request'));
	}
	
	Token.findOne({
		accessToken: accessToken
	}, function(err, token){
		if(err){
			return cb(err);
		}
		
		if(token === null){
			return cb(new oauth2orize.TokenError(
					'given access token was expired',
					'invalid_grant'));
		}
		
		//
		if ((Date.now() - token.createdTime) > (token.expiredIn * 1000)) {
            console.log('token is expired!!');
            return cb(new oauth2orize.TokenError(
                    'given access token was expired',
                    'invalid_grant'));
        }
        return cb(null, token);
	});
	

	
};

module.exports.create = createToken;
module.exports.refresh = refreshToken;
module.exports.validate = validateToken;