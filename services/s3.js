/**
 * aws-wrapper
 * ===
 * S3 service
 */

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var stream = require('stream');

module.exports = function (s3) {
	return {
		/**
		 * Get S3 url based on S3 full path
		 *
		 * @param {String} s3Path - full S3 path, including bucket name and the path itself
		 *
		 * @return {String} s3Url
		 */
		getUrl: function (s3Path) {
			return 'https://s3.amazonaws.com/' + path.normalize(s3Path);
		},

		/**
		* Delete file from S3
		*
		* @callback deleteCallback
		* @param {Object} error
		*
		* @param {String} s3Path - S3 file path, including bucket name. E.g. myBucket/path/to/folder/file.txt
		* @param {deleteCallback} callback
		*/
		deleteFile: function (s3Path, callback) {
			if (typeof s3Path === 'function') {
				callback = s3Path;
				s3Path = null;
			}

			if (!s3Path) {
				return callback(new Error('S3 path is required!'));
			}

			s3Path = path.normalize(s3Path);
			pathParts = s3Path.split('/');

			var bucket = pathParts[0];
			var key = s3Path.replace(bucket + '/', '');

			if (pathParts.length < 2 || !key) {
				return callback(new Error('S3 path should contain both bucket and file names'));
			}

			var params = {
				Bucket: bucket,
				Key: key
			};

			s3.deleteObject(params, function (error, data) {
				callback(error);
			});
		},

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
		getFileContents: function (s3Path, callback) {
			s3Path = path.normalize(s3Path);
			pathParts = s3Path.split('/');

			var params = {
				Bucket: pathParts[0],
				Key: s3Path.replace(pathParts[0] + '/', '')
			};

			s3.getObject(params, function (error, data) {
				if (data && data.Body) {
					return callback(error, data.Body.toString());
				}

				callback(error);
			});
		},

		// @TODO: In next Major release - make the uploadCallback to have only 2 params - error and resultObj. Merge s3Url into extraInfo obj.

		/**
		 * Upload file to S3
		 *
		 * @callback uploadCallback
		 * @param {Object} error
		 * @param {String} s3Url
		 * @param {Object} extraInfo - contains extra info, such as bucket and key
		 *
		 * @param {String} s3Path - S3 file path, including bucket name. E.g. myBucket/path/to/folder/file.txt
		 * @param {String|Object} dataSource - local file path to be uploaded, or a ReadableStream object
		 * @param {Object} options (optional) - contains extra options.
		 *								Currently supports 2 params:
		 *								{
		 *									contentType: <value>, // content type of the `dataSource` file,
		 *									acl: <value> // S3 acl string (http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl)
		 *								}
		 * @param {uploadCallback} callback
		 */
		upload: function (s3Path, dataSource, options, callback) {
			var self = this;
			var pathParts = [];

			if (typeof s3Path === 'function') {
				callback = s3Path;
				s3Path = null;
			}
			else if (typeof dataSource === 'function') {
				callback = dataSource;
				dataSource = null;
			}
			else if (typeof options === 'function') {
				callback = options;
				options = {};
			}

			if (!s3Path || !dataSource) {
				return callback(new Error('S3 path and local path are required!'));
			}

			// if no contentType provided and dataSource is file path - try to detect it's content type
			if (!options.contentType && !(dataSource instanceof stream.Readable)) {
				options.contentType = mime.lookup(dataSource);
			}

			s3Path = path.normalize(s3Path);
			pathParts = s3Path.split('/');

			var bucket = pathParts[0];
			var key = s3Path.replace(bucket + '/', '');

			if (pathParts.length < 2 || !key) {
				return callback(new Error('S3 path should contain both bucket and file names'));
			}

			var pushToBucket = function () {
				var params = {
					Bucket: bucket,
					Key: key,
					Body: dataSource,
					ContentType: options.contentType,
					ACL: options.acl || 'public-read'
				};

				// A file path passed - create a readable stream
				if (!(dataSource instanceof stream.Readable)) {
					fs.stat(dataSource, function (error, stats) {
						if (error) {
							return callback(error);
						}

						if (!stats || !stats.isFile() || !stats.size) {
							return callback(new Error('File doesn\'t exist or is empty'));
						}

						params.Body = fs.createReadStream(dataSource);
						s3.upload(params, function (error, data) {
							var extraInfo = {
								bucket: bucket,
								key: key
							};

							callback(error, self.getUrl(s3Path), extraInfo);
						});
					});
				}
				else {
					s3.upload(params, function (error, data) {
						var extraInfo = {
							bucket: bucket,
							key: key
						};

						callback(error, self.getUrl(s3Path), extraInfo);
					});
				}
			};

			s3.listBuckets(function (error, result) {
				if (error) {
					return callback(error);
				}

				if (_.findIndex(result.Buckets, { Name: bucket }) !== -1) {
					pushToBucket();
				}
				else {
					// Bucket is missing
					s3.createBucket({Bucket: bucket}, function (error, result) {
						if (error) {
							if (!error.code || error.code !== 'BucketAlreadyOwnedByYou') {
								return callback(error);
							}
						}

						pushToBucket();
					});
				}
			});
		}
	};
};
