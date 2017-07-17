module.exports.oauth2 = {
	// 각 grant type 및 refreshable 에 대하여 token_duration을 사용자 정의할 수 있다.
	// implicit 허용 유형의 토큰 재생은 항상 규격별 'false'이어야 한다.
	type : {
		authorizationCode : {
			name : "authorization_code",
			token_refreshable : true,
			token_duration : 3600
		},
		implicit : {
			name : "token",
			token_refreshable : false, // 항상 false
			token_duration : 3600
		},
		password : {
			name : "password",
			token_refreshable : true,
			token_duration: 3600 * 24 * 365
		},
		clientCredentials: {
			name: "client_credentials",
			token_refreshable: false,
			token_duration: 0
		}
	}
};