const resultsEnum = Object.freeze({
	SUCCESS:{
		code: 1,
		message: "Success"
	},
	UNHANDLED_ERROR:{
		code: 100,
		message: "Unhandled error: "
	},
	ER_DUP_ENTRY:{
		code: 101,
		message: "Duplicate entry"
	},
	PROTOCOL_SEQUENCE_TIMEOUT:{
		code: 201,
		message: "Connection timeout"
	},
	ETIMEDOUT:{
		code: 202,
		message: "Connection timeout"
	}
});

module.exports = resultsEnum;