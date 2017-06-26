// 사용자 리스트 조회 함수
var listuser = function(params, callback){
	console.log('JSON-RPC listuser 호출됨.');
	console.dir(params);
	
	// db 객체 접근
	var database = require('../database/database');
	
	if (database){
		console.log('database 객체 참조됨.');
	} else {
		console.log('database 객체 불가함.');
		callback({
			code : 410,
			message : 'database 객체 불가함.'
		}, null);
		return;
	}
	
	if(database.db){
		// 모든 사용자 검색
		database.UserModel.findAll(function(err, results){
			if(results){
				console.log('결과물 문서 데이터의 개수 : %d', results.length);
				
				var output = [ ]; // 자료구조
				for(var i = 0; i< results.length;i++){
					var curId = results[i]._doc.id;
					var curName = results[i]._doc.name;
					output.push({id : curId, name : curName });
				}
				console.dir(output);
				callback(null, output);
			}
		});
	}
};

module.exports = listuser;