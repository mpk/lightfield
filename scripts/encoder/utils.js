/**
 *	Utilities
 */
var cp = require('child_process');

module.exports = {

	/**
	 *	Create frame list.
	 *
	 *	@param {number} matrixWidth
	 *	@param {number} matrixHeight
	 *	@return {Array.<object>}
	 */
	createFrameList( matrixWidth, matrixHeight ) {
		var frameCount = matrixWidth * matrixHeight;

		return Array.from({ length: frameCount }, ( value, index ) => {
			var topLeftX = index % matrixWidth;
			var topLeftY = Math.floor(index / matrixWidth);
			var sources = null;

			// If frame is predicted, determine sources
			if (topLeftX % 2 == 1 || topLeftY % 2 == 1) {
				if (topLeftX % 2 === 0) { // N / S
					sources = [
						{ index: index - matrixWidth, relIndex: 1 },
						{ index: index + matrixWidth, relIndex: 7 }
					];
				} else if (topLeftY % 2 === 0) { // W / E
					sources = [
						{ index: index - 1, relIndex: 3 },
						{ index: index + 1, relIndex: 5 }
					];
				} else {
					sources = [ // NW / NE / SW / SE
						{ index: index - matrixWidth - 1, relIndex: 0 },
						{ index: index - matrixWidth + 1, relIndex: 2 },
						{ index: index + matrixWidth - 1, relIndex: 6 },
						{ index: index + matrixWidth + 1, relIndex: 8 }
					];
				}
			}

			return { index, sources };
		});
	},

	/**
	 *	Create promise list with limited concurrency.
	 *
	 *	@param {Array.<*>} array
	 *	@param {number} taskCount
	 *	@param {function} promiseFactory
	 *	@return {Array.<Promise>}
	 */
	mapLimit( array, taskCount, promiseFactory ) {
		var taskQueue = [];
		var queueRejected = false;

		function runTask( task ) {
			promiseFactory.call(this, task.item).then(( returnValue ) => {
				if (!queueRejected) {
					task.resolve(returnValue);
					runNextTask();
				}
			}).catch(( returnValue ) => {
				queueRejected = true;
				task.reject(returnValue);
			});
		}

		function runNextTask() {
			if (taskQueue.length) {
				runTask(taskQueue.shift());
			}
		}

		var promiseList = array.map(( item ) => {
			return new Promise(( resolve, reject ) => {
				taskQueue.push({ resolve, reject, item });
			});
		});

		for (var i = 0; i < taskCount; i += 1) {
			runNextTask();
		}

		return promiseList;
	},

	/**
	 *	Spawn process.
	 *
	 *	@param {string} execPath
	 *	@param {Array.<string>} execArgs
	 *	@return {Promise}
	 */
	spawnProcess( execPath, execArgs ) {
		return new Promise(( resolve, reject ) => {
			var stdoutBuffer = new Buffer([]);
			var stderrBuffer = new Buffer([]);

			var process = cp.spawn(execPath, execArgs);

			process.stdout.on('data', ( data ) => {
				stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
			});

			process.stderr.on('data', ( data ) => {
				stderrBuffer = Buffer.concat([stderrBuffer, data]);
			});

			process.on('error', () => reject(stderrBuffer.toString('utf8')));
			process.on('exit', ( code ) => {
				if (!code) {
					resolve(stdoutBuffer.toString('utf8'));
				} else {
					reject(stderrBuffer.toString('utf8'));
				}
			});
		});
	}

};