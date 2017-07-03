var index = function(req, res){
	console.log('index 라우팅 모듈 호출됨.');
	
	res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'});
	res.write('<h2>index 모듈 호출</h2>');
	res.end();
};

module.exports.index = index;