/**
 *	BEM class name factory
 */
var classNames = require('classnames');

/**
 *	Create BEM class name factory for the specified block name.
 *
 *	@param {string} blockName
 *	@return {function}
 */
module.exports = function( blockName ) {
	return ( elemName, ...modNames ) => {
		return classNames(createName(blockName, elemName), modNames.length ? modNames.map(( modName ) => {
			if (typeof modName == 'string') {
				return createName(blockName, elemName, modName);
			} else if (Array.isArray(modName)) {
				return modName.map(createName.bind(this, blockName, elemName));
			} else if (typeof modName == 'object') {
				return mapObjectKeys(modName, createName.bind(this, blockName, elemName));
			}
		}) : undefined);
	};
};

function createName( blockName, elemName, modName ) {
	var className = blockName;

	if (elemName) className += '__' + elemName;
	if (modName) className += '_' + modName;

	return className;
}

function mapObjectKeys( object, callback ) {
	var outputObject = {};

	for (let key in object) {
		if ({}.hasOwnProperty.call(object, key)) {
			outputObject[callback.call(this, key)] = object[key];
		}
	}

	return outputObject;
}