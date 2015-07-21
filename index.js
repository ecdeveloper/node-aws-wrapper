/**
 * AWS Library
 * Serves as a wrapper for node aws-sdk
*/

var AWS = require('aws-sdk');

module.exports = function (config) {
	AWS.config.update({
		"accessKeyId": config.accessKeyId,
		"secretAccessKey": config.secretAccessKey,
		"region": config.region
	});

	return {
		s3: require('./services/s3')(new AWS.S3()),
		sqs: require('./services/sqs')(new AWS.SQS())
	};
};
