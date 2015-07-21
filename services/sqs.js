/**
 * aws-wrapper
 * ===
 * SQS service
 */

module.exports = function (sqs) {
	return {
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
		pushMessage: function (queueName, msgObj, callback) {
			if (typeof queueName === 'function') {
				return queueName(new Error('Queue name and Message object are required!'));
			}

			if (!typeof msgObj === 'function') {
				return msgObj(new Error('Message object is required!'));
			}

			sqs.getQueueUrl({ QueueName: queueName }, function (err, data) {
				if (err) {
					return callback(err);
				}

				sqs.sendMessage({
					QueueUrl: data.QueueUrl,
					MessageBody: JSON.stringify(msgObj)
				}, callback);
			});
		},

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
		getMessage: function (queueName, callback) {
			if (typeof queueName === 'function') {
				return queueName(new Error('Queue name is required!'));
			}

			sqs.getQueueUrl({ QueueName: queueName }, function (err, data) {
				if (err) {
					return callback(err);
				}

				sqs.receiveMessage({
					QueueUrl: data.QueueUrl
				},
				function (err, result) {
					var msg = null;

					if (result && result.Messages) {
						msg = result.Messages.pop();
						msg.QueueUrl = data.QueueUrl; // Store queue url in message object, for further possible use

						// Parse the body string
						try {
							msg.Obj = JSON.parse(msg.Body);
						}
						catch (e) {
							msg.Obj = {};
						}
					}

					return callback(err, msg);
				});
			});
		},

		/**
		 * Delete a message from SQS by Receipt Handle
		 *
		 * @callback deleteCallback
		 * @param {Object} error
		 * @param {Object} result - contains metadata
		 *
		 *
		 * @param {String} queueName
		 * @param {String} receiptHandle
		 * @param {deleteCallback} callback
		 */
		deleteMessage: function (queueName, receiptHandle, callback) {
			if (typeof queueName === 'function') {
				return queueName(new Error('Queue name and Message id are required!'));
			}

			if (typeof receiptHandle === 'function') {
				return receiptHandle(new Error('Receipt Handle is required!'));
			}

			sqs.getQueueUrl({ QueueName: queueName }, function (err, data) {
				if (err) {
					return callback(err);
				}

				sqs.deleteMessage({ QueueUrl: data.QueueUrl, ReceiptHandle: receiptHandle }, callback);
			});
		},

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
		purgeQueue: function (queueName, callback) {
			if (typeof queueName === 'function') {
				return queueName(new Error('Queue name is required!'));
			}

			sqs.getQueueUrl({ QueueName: queueName }, function (err, data) {
				if (err) {
					return callback(err);
				}

				sqs.purgeQueue({
					QueueUrl: data.QueueUrl
				},
				callback);
			});
		}
	};
};
