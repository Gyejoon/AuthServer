var echo = function(params, callback){
	console.log('JSON-RPC echo 호출됨.');
	console.dir(params);
	callback(null, params);	// 결과값을 callback 함수로 전달(return 사용하지 않음!!)
};

module.exports = echo;