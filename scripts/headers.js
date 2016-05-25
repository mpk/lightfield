/**
 *	Insert header to output files
 */
var fs = require('fs');
var pkg = require('../package');

var Project = [
	pkg.name + ' ' + pkg.version,
	'(c) ' + (new Date()).getFullYear() + ' mpk ~ https://github.com/mpk'
];

var Files = {
	'build/build.js': [
		'arr-diff - https://github.com/jonschlinkert/arr-diff',
		'arr-flatten - https://github.com/jonschlinkert/arr-flatten',
		'classnames - https://github.com/JedWatson/classnames',
		'emitter - https://github.com/component/emitter',
		'math - https://github.com/mpk/math',
		'react - https://github.com/facebook/react',
		'react-redux - https://github.com/rackt/react-redux',
		'redux - https://github.com/rackt/redux',
		'redux-actions - https://github.com/acdlite/redux-actions',
		'redux-thunk - https://github.com/gaearon/redux-thunk',
		'screenfull - https://github.com/sindresorhus/screenfull.js'
	],
	'build/build.css': [

	]
};

for (var path in Files) {
	var contents = fs.readFileSync(path, 'utf8');
	fs.writeFileSync(path, '/**\n *\t' + Project.join('\n *\t') + '\n *\n *\t' + Files[path].join('\n *\t') + '\n */\n' + contents);
}