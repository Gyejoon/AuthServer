
/*
 * 설정
 */

var local_login = require('./passport/local_login');
var local_signup = require('./passport/local_signup');
var facebook = require('./passport/facebook');
var twitter = require('./passport/twitter');
var google = require('./passport/google');

module.exports = function (app, passport) {
	console.log('config/passport 호출됨.');
	
	// 사용자 인증 성공 시 호출
	passport.serializeUser(function(user, done) {
		console.log('serializeUser() 호출됨.');
		console.dir(user);
		
	    done(null, user);
	});

	// 사용자 인증 이후 사용자 요청 시마다 호출
	passport.deserializeUser(function(user, done) {
		console.log('deserializeUser() 호출됨.');
		console.dir(user);

		// 사용자 정보 중 id나 email만 있는 경우 사용자 정보 조회 필요 - 여기에서는 user 객체 전체를 패스포트에서 관리
		done(null, user);
	});

	// 인증방식 설정
	passport.use('local-login', local_login);
	passport.use('local-signup', local_signup);
	passport.use('facebook', facebook(app, passport));
	passport.use('twitter', twitter(app, passport));
	passport.use('google', google(app, passport));
	console.log('5가지 passport 인증방식 설정됨.');
	
};