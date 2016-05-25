/**
 *	Test runner options
 */
module.exports = function( options ) {
	options.set({
		frameworks: ['browserify', 'jasmine'],
		files: [{ pattern: '../*-spec.js' }],
		preprocessors: { '../*-spec.js': ['browserify'] },
		browserify: { transform: ['babelify'] },
		plugins: ['karma-jasmine', 'karma-browserify']
	});
};