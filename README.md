# AWS wrapping module #

This module is a wrapper for the official [aws-sdk](https://www.npmjs.org/package/aws-sdk) module. It incapsulates all routines, and exposes some simple straight-forward methods. Currently it wraps some methods only for S3 and SQS services. More methods and services will be added in the future.

Note: The module has been developed while working for Trendalytics.

## API ##

After instantiating aws-wrapper, it will contain 2 objects - s3 and sqs. Below is the API for each of them.

### S3 ###
```
#!JavaScript
/**
 * Get S3 url based on S3 full path
 *
 * @param {String} s3Path - full S3 path, including bucket name and the path itself
 *
 * @return {String} s3Url
 */
aws.s3.getUrl(s3Path);

/**
 * Upload file to S3
 *
 * @callback uploadCallback
 * @param {Object} error
 * @param {String} s3Url
 * @param {Object} extraInfo - contains extra info, such as bucket and key
 *
 *
 * @param {String} s3Path - S3 file path, including bucket name. E.g. myBucket/path/to/folder/file.txt
 * @param {String|Object} dataSource - local file path to be uploaded, or a ReadableStream object
 * @param {uploadCallback} callback
 */
aws.s3.upload(s3Path, dataSource, callback);

/**
 * Get S3 file contents
 *
 * @callback methodCallback
 * @param {Object} error
 * @param {String} fileContents
 *
 * @param {String} s3Path - S3 file path, including bucket name. E.g. myBucket/path/to/folder/file.txt
 * @param {methodCallback} callback
*/
aws.s3.getFileContents(s3Path, callback);
```

### SQS ###
```
#!JavaScript
/**
 * Push a message to SQS
 *
 * @callback pushCallback
 * @param {Object} error
 * @param {Object} result - contains result object: { ResponseMetadata: { <meta data> }, MD5OfMessageBody: '<hash>', MessageId: '<id> }
 *
 *
 * @param {String} queueName
 * @param {Object} msgObj
 * @param {pushCallback} callback
 */
aws.sqs.pushMessage(queueName, msgObj, callback);

/**
 * Get a message from SQS
 *
 * @callback getCallback
 * @param {Object} error
 * @param {Object} message - contains all data related to message. Most useful properties - message.Obj and message.MessageId
 *
 *
 * @param {String} queueName
 * @param {getCallback} callback
 */
aws.sqs.getMessage(queueName, callback);

/**
 * Delete a message from SQS by Receipt Handler
 *
 * @callback deleteCallback
 * @param {Object} error
 * @param {Object} result - contains metadata
 *
 *
 * @param {String} queueName
 * @param {String} receiptHandler
 * @param {deleteCallback} callback
 */
aws.sqs.deleteMessage(queueName, receiptHandler, callback);

/**
 * Purge a queue by name
 *
 * @callback methodCallback
 * @param {Object} error
 * @param {Object} result - metadata
 *
 *
 * @param {String} queueName
 * @oaram {methodCallback} callback
 */
aws.sqs.purgeQueue(queueName, callback);
```

## Usage ##

```
#!JavaScript

var awsConfig = {
	"accessKeyId": "<access key id>",
	"secretAccessKey": "<secret access key>",
	"region": "<region>"
};

var aws = require('aws-wrapper')(awsConfig);

// Upload an Image to S3
aws.s3.upload('my-bucket', 'path/to/a/folder/filename.png', '/tmp/some-file.png', function (err, s3Url) {
	if (err) { throw err; }
	console.log('Image url is', s3Url);
});

/***  Manage SQS ***/

// Message obj to push to queue
var msgObj = {
	action: 'do-some-action',
	params: {
		param1: 'value1',
		param2: 'value2'
	}
};

// Push to SQS
aws.sqs.pushMessage('my-queue', msgObj, function (err, data) {
	if (err) { throw err; }

	// Make use of `data` object
	// ...
});

// Get a message from SQS
aws.sqs.getMessage('my-queue', function (err, data) {
	if (err) { throw err; }

	if (data && data.Obj) {
		// Make use of `data.Obj`
		// ...
	}
});

// Purge a SQS queue
aws.sqs.purgeQueue('my-queue', function (err, data) {
    if (err) { throw err; }
});
```
