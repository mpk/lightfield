/**
 *	Tasks
 */
'use strict';

var cp = require('child_process');
var fs = require('fs');
var tmp = require('tmp');
var utils = require('./utils');

module.exports = {

	/**
	 *	Check if specified executable is in PATH.
	 *
	 *	@param {string} name
	 *	@return {Promise}
	 */
	checkExec( name ) {
		return new Promise(( resolve, reject ) => {
			var process = cp.spawn(name, []);

			process.on('error', () => reject(`You do not have '${name}' installed (not found in PATH).`));
			process.on('exit', () => resolve());
		});
	},

	/**
	 *	Create temporary directory in default system location.
	 *
	 *	@return {Promise}
	 */
	createTempDir() {
		return new Promise(( resolve, reject ) => {
			tmp.dir({ unsafeCleanup: true }, ( err, path ) => {
				if (!err) {
					resolve(path);
				} else {
					reject('Cannot create temporary directory.');
				}
			});
		});
	},

	/**
	 *	Compile Go source file.
	 *
	 *	@param {string} path
	 *	@param {string} outputPath
	 *	@return {Promise}
	 */
	compileFromSource( path, outputPath ) {
		return new Promise(( resolve, reject ) => {
			utils.spawnProcess('go', ['build', '-o', outputPath, path]).then(() => {
				resolve(outputPath);
			}).catch(( error ) => {
				reject(error);
			});
		});
	},

	/**
	 *	Encode intra frame.
	 *
	 *	@param {string} execPath
	 *	@param {string} sourcePath
	 *	@param {number} imageQuality
	 *	@param {string} outputPath
	 *	@return {Promise}
	 */
	encodeIntraFrame( execPath, sourcePath, imageQuality, outputPath ) {
		return utils.spawnProcess(execPath, ['-i', sourcePath, '-o', outputPath, '-q', imageQuality])
			.then(( encoderData ) => {
				var psnrValue = parseFloat(encoderData.match(/PSNR: (\d+.\d+)dB/)[1]);
				var ssimValue = parseFloat(encoderData.match(/SSIM: (\d+.\d+)/)[1]);

				// Optimize JPEG output
				return utils.spawnProcess('jpegoptim', ['--strip-all', outputPath]).then(() => {
					return {
						psnrValue,
						ssimValue,
						sizeBefore: fs.statSync(sourcePath).size,
						sizeAfter: fs.statSync(outputPath).size
					};
				});
			});
	},

	/**
	 *	Encode predicted frame.
	 *
	 *	@param {string} execPath
	 *	@param {string} sourcePath
	 *	@param {string} predSources
	 *	@param {string} outputPath
	 *	@return {Promise}
	 */
	encodePredFrame( execPath, sourcePath, predSources, outputPath ) {
		var tmpFileName = tmp.tmpNameSync();

		return utils.spawnProcess(execPath, ['-t', sourcePath, '-o', tmpFileName, '-s', predSources])
			.then(( encoderData ) => {
				var psnrValue = parseFloat(encoderData.match(/PSNR: (\d+.\d+)dB/)[1]);
				var ssimValue = parseFloat(encoderData.match(/SSIM: (\d+.\d+)/)[1]);
				var width = parseFloat(encoderData.match(/Size: (\d+)x(\d+)/)[1]);
				var height = parseFloat(encoderData.match(/Size: (\d+)x(\d+)/)[2]);

				// Optimize PNG output
				return utils.spawnProcess('pngcrush', ['-rem', 'alla', '-reduce', '-brute', tmpFileName, outputPath]).then(() => {
					fs.unlinkSync(tmpFileName);

					return {
						psnrValue,
						ssimValue,
						width,
						height,
						sizeBefore: fs.statSync(sourcePath).size,
						sizeAfter: fs.statSync(outputPath).size
					};
				});
			});
	},

	/**
	 *	Create depth map.
	 *
	 *	@param {string} execPath
	 *	@param {number} matrixWidth
	 *	@param {number} matrixHeight
	 *	@param {string} sources
	 *	@param {string} outputPath
	 *	@return {Promise}
	 */
	createDepthMap( execPath, matrixWidth, matrixHeight, sources, outputPath ) {
		var tmpFileName = tmp.tmpNameSync();

		return utils.spawnProcess(execPath, ['-w', matrixWidth, '-h', matrixHeight, '-o', tmpFileName, '-i', sources])
			.then(( data ) => {
				var minFocus = parseFloat(data.match(/Focus-Min: (-?\d+\.\d+)/)[1]);
				var maxFocus = parseFloat(data.match(/Focus-Max: (-?\d+\.\d+)/)[1]);

				// Optimize PNG output
				return utils.spawnProcess('pngcrush', ['-rem', 'alla', '-reduce', '-brute', tmpFileName, outputPath]).then(() => {
					fs.unlinkSync(tmpFileName);

					return {
						minFocus,
						maxFocus
					};
				});
			});
	}

};