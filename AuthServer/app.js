//===== 모듈 불러들이기 =====//
var express = require('express')
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , https = require('https')
  , fs = require('fs')
  , debug = require('debug')('backend')
  , session = require('express-session');


var config = require('./config/config');
var database = require('./database/database');
var route_loader = require('./routes/route_loader');
var oauth2Router = require('./route/oauth2Router');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressErrorHandler = require('express-error-handler');


//===== Passport 사용 =====//
var passport = require('passport');
var flash = require('connect-flash');

//===== Express 서버 객체 만들기 =====//
var app = express();


//===== 뷰 엔진 설정 =====//
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));

//===== 서버 변수 설정 및 static으로 public 폴더 설정  =====//
console.log('config.server_port : %d', config.server_port);
app.set('port', config.server_port);
app.use('/public', express.static(path.join(__dirname, 'public')));

// 지역 미들웨어의 선언
// https
var redirectHttps = function(){
	return function(req, res, next){
		if(!req.secure){
			console.log('redirect secure http server');
			return res.redirect('https://' + req.host + ':3443' + req.url);
		}
		next();
	};
};


//===== body-parser, cookie-parser, express-session 사용 설정 =====//
app.use(logger('dev')); // 로깅
app.all('*', redirectHttps());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(app.router);
//라우팅 정보를 읽어들여 라우팅 설정
route_loader.init(app);
oauth2Router.initialize(app);

//===== Passport 관련 라우팅 및 설정 =====//

// 패스포트 설정
var configPassport = require('./config/passport');
configPassport(app, passport);

//패스포트 관련 함수 라우팅
var userPassport = require('./routes/user_passport');
userPassport(app, passport);


//===== 404 에러 페이지 처리 =====//
var errorHandler = expressErrorHandler({
 static: {
   '404': './public/404.html'
 }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


//===== 서버 시작 =====//

//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', function (err) {
	console.log('uncaughtException 발생함 : ' + err);
	console.log('서버 프로세스 종료하지 않고 유지함.');
	
	console.log(err.stack);
});

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
    console.log("프로세스가 종료됩니다.");
    app.close();
});

app.on('close', function () {
	console.log("Express 서버 객체가 종료됩니다.");
	if (database.db) {
		database.db.close();
	}
});

var privateKey = './ssl/key.pem';
var publicCert = './ssl/public.cert';
var publicCertPassword = '12345';
var httpsConfig = {
	key: fs.readFileSync(privateKey),
	cert: fs.readFileSync(publicCert),
	passphrase: publicCertPassword
};

// http
// 시작된 서버 객체를 리턴받도록 합니다. 
var server = http.createServer(app).listen(app.get('port'), function(){
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));

	// 데이터베이스 초기화
	database.init(app, config);
   
});

// https
var sslServer = https.createServer(httpsConfig, app);
sslServer.listen(3443, function(){
	debug('Express SSL server listening on port '+ sslServer.address().port);
});
