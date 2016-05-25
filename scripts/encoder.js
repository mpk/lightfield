/**
 *	Light field encoder
 */
'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var os = require('os');
var path = require('path');
var yargs = require('yargs');
var tasks = require('./encoder/tasks');
var utils = require('./encoder/utils');

// Process user input
var argv = yargs
	.usage('Converts light field (matrix of images) to custom format\n'
		+ 'Usage: node encoder.js -i [folder_path] -o [folder_path] -w [number] -h [number] -q [number]')
	.demand(['i', 'o', 'w', 'h', 'q'])
	.describe('i', 'Input folder with source images')
	.describe('o', 'Output folder')
	.describe('w', 'Matrix width (must be odd number)')
	.describe('h', 'Matrix height (must be odd number)')
	.describe('q', 'JPEG quality (1-100)')
	.check(function( argv ) {
		if (typeof argv.i != 'string' || !fs.existsSync(argv.i)) {
			throw '[error] Input folder does not exist.';
		}

		if (typeof argv.o != 'string') {
			throw '[error] Output folder must be a string.';
		}

		if (typeof argv.w != 'number' || typeof argv.h != 'number') {
			throw '[error] Matrix width and height must be a number.';
		}

		if (argv.w % 2 === 0 || argv.h % 2 === 0) {
			throw '[error] Matrix width and height must be odd number.';
		}

		if (typeof argv.q != 'number') {
			throw '[error] JPEG quality must be a number.';
		}

		return true;
	}).argv;

// User input
var sourcePath = path.resolve(argv.i);
var outputPath = path.resolve(argv.o);
var matrixWidth = argv.w;
var matrixHeight = argv.h;
var imageQuality = argv.q;

// Prepare and start encoder(s)
var startTime = Date.now();
Promise.all([
	// Check for prerequisities
	tasks.checkExec('go'),
	tasks.checkExec('pngcrush'),
	tasks.checkExec('jpegoptim')
]).then(() => tasks.createTempDir()).then(( tmpPath ) => Promise.all([
	// Precompile Go encoders to prevent `go run` overhead (also checks for errors)
	tasks.compileFromSource(path.join('encoder', 'encoder-intra.go'), path.join(tmpPath, 'encoder-intra.exe')),
	tasks.compileFromSource(path.join('encoder', 'encoder-pred.go'), path.join(tmpPath, 'encoder-pred.exe')),
	tasks.compileFromSource(path.join('encoder', 'depth-map.go'), path.join(tmpPath, 'depth-map.exe'))
])).then(( execPaths ) => {
	// Create output folder if it does not exist yet
	if (!fs.existsSync(outputPath)) {
		mkdirp.sync(outputPath);
	}

	// Create frame lists
	var frames = utils.createFrameList(matrixWidth, matrixHeight);
	var intraFrames = frames.filter(( frame ) => !frame.sources);
	var predFrames = frames.filter(( frame ) => !!frame.sources);

	// Check sources
	frames.forEach(( frame ) => {
		var sourceFile = `${path.join(sourcePath, String(frame.index))}.png`;
		if (!fs.existsSync(sourceFile)) {
			throw new Error(`Cannot find source file: ${sourceFile}`);
		}
	});

	// Start encoders
	var sizeBefore = 0;
	var sizeAfter = 0;

	var intraPsnr = 0;
	var intraSsim = 0;
	var predPsnr = 0;
	var predSsim = 0;

	var frameWidth = 0;
	var frameHeight = 0;

	var startedTasks = 0;

	function onTaskStart() {
		startedTasks += 1;
		console.info(`[info] Progress: ${((startedTasks / frames.length) * 100).toFixed(2)} %`);
	}

	return Promise.all(utils.mapLimit(intraFrames, MaxProcesses, ( frame ) => {
		// Encode intra frames
		var sourceFile = `${path.join(sourcePath, String(frame.index))}.png`;
		var outputFile = `${path.join(outputPath, String(frame.index))}.lfi`;

		onTaskStart();
		return tasks.encodeIntraFrame(execPaths[0], sourceFile, imageQuality, outputFile).then(( frameStats ) => {
			sizeBefore += frameStats.sizeBefore;
			sizeAfter += frameStats.sizeAfter;
			intraPsnr += frameStats.psnrValue;
			intraSsim += frameStats.ssimValue;
		});
	})).then(() => Promise.all(utils.mapLimit(predFrames, MaxProcesses, ( frame ) => {
		// Encode predicted frames
		var sourceFile = `${path.join(sourcePath, String(frame.index))}.png`;
		var outputFile = `${path.join(outputPath, String(frame.index))}.lfi`;
		var predSources = frame.sources.map(( source ) => `${path.join(outputPath, String(source.index))}.lfi|${source.relIndex}`).join(',');

		onTaskStart();
		return tasks.encodePredFrame(execPaths[1], sourceFile, predSources, outputFile).then(( frameStats ) => {
			sizeBefore += frameStats.sizeBefore;
			sizeAfter += frameStats.sizeAfter;
			predPsnr += frameStats.psnrValue;
			predSsim += frameStats.ssimValue;

			frameWidth = frameStats.width;
			frameHeight = frameStats.height;
		});
	}))).then(() => {
		// Create depth map
		console.info('[info] Creating depth map...');

		var depthMatrixWidth = Math.min(DepthSampleSize, matrixWidth);
		var depthMatrixHeight = Math.min(DepthSampleSize, matrixHeight);
		var depthOffsetX = Math.floor(depthMatrixWidth / 2);
		var depthOffsetY = Math.floor(depthMatrixHeight / 2);
		var depthSources = [];

		// Source frames
		for (var depthY = -depthOffsetY; depthY <= depthOffsetY; depthY++) {
			for (var depthX = -depthOffsetX; depthX <= depthOffsetX; depthX++) {
				var sourceIndex = Math.floor(matrixWidth * matrixHeight / 2) + (depthY * matrixWidth + depthX);
				depthSources.push(`${path.join(sourcePath, String(sourceIndex))}.png`);
			}
		}

		return tasks.createDepthMap(execPaths[2], depthMatrixWidth, depthMatrixHeight, depthSources.join('|'), path.join(outputPath, 'depth.png'));
	}).then(( depthMapStats ) => {
		// Create manifest
		fs.writeFileSync(path.join(outputPath, 'manifest.json'), JSON.stringify({
			version: 1,
			frame: { width: frameWidth, height: frameHeight },
			matrix: { width: matrixWidth, height: matrixHeight },
			focus: { min: depthMapStats.minFocus, max: depthMapStats.maxFocus }
		}, null, '\t'));

		// Output stats
		var elapsedTime = (Date.now() - startTime) / 1000;
		console.info(`[info] Elapsed time: ${Math.floor(elapsedTime / 60)}m ${parseInt(elapsedTime - Math.floor(elapsedTime / 60) * 60)}s`);
		console.info(`[info] I-frames: ${intraFrames.length} (${(intraFrames.length / frames.length * 100).toFixed(2)}%)`);
		console.info(`[info] P-frames: ${predFrames.length} (${(predFrames.length / frames.length * 100).toFixed(2)}%)`);
		console.info(`[info] Average I-frame PSNR: ${(intraPsnr / intraFrames.length).toFixed(2)} dB`);
		console.info(`[info] Average I-frame SSIM: ${(intraSsim / intraFrames.length).toFixed(3)}`);
		console.info(`[info] Average P-frame PSNR: ${(predPsnr / predFrames.length).toFixed(2)} dB`);
		console.info(`[info] Average P-frame SSIM: ${(predSsim / predFrames.length).toFixed(3)}`);
		console.info(`[info] Compression ratio: ${(sizeBefore / sizeAfter).toFixed(2)}x (${(sizeBefore / 1048576).toFixed(2)} MB => ${(sizeAfter / 1048576).toFixed(2)} MB)`);
		console.info('[info] Encoding has finished.');
	});
}).catch(( error ) => {
	console.error(error, error.stack);
	console.error('[error] Encoding has failed.');
});

const MaxProcesses = os.cpus().length;
const DepthSampleSize = 5;