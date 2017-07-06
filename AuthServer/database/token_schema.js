var Schema = {};

Schema.createSchema = function(mongoose){
	
	var tokenSchema = mongoose.Schema({
		accessToken : {type: String, 'default':''},
		refreshToken : {type: String, 'default':''},
		expiredIn : {type: Number, 'default':''},
		clientId : {type: String, 'default':''},
		userId : {type: String, 'default':''},
		createdTime : {type: Number, 'default':''}
	});
	
	tokenSchema.pre('save', function (next){
		if(!this.isNew){
			return next();
		}
		this.createdTime = Date.now();
		next();
	});
	
	mongoose.model('token', tokenSchema);
	
	console.log('tokenSchema 정의함.');
	
	return tokenSchema;
};

module.exports = Schema;