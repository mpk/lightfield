/**
 *	Utilities
 */
var utils = {

	/**
	 *	Get pixel data from the specified image.
	 *
	 *	@param {HTMLImageElement} resource
	 *	@return {Uint8ClampedArray}
	 */
	getImageData( resource ) {
		var canvas = document.createElement('canvas');
		canvas.width = resource.width;
		canvas.height = resource.height;

		var ctx = canvas.getContext('2d');
		ctx.drawImage(resource, 0, 0);

		return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
	},

	/**
	 *	Create a new array with the results of calling the specified function on every element of the passed array.
	 *	The callback function must return an array, whose elements are then added to the created array.
	 *
	 *	@param {Array.<*>} array
	 *	@param {function} callback
	 *	@return {Array.<*>}
	 */
	mapArray( array, callback ) {
		var result = [];

		array.forEach(( element, index ) => {
			var returnValue = callback.call(this, element, index);
			returnValue.forEach(( element ) => result.push(element));
		});

		return result;
	},

	/**
	 *	Display pixel ratio (1 = standard display, 2 = high-resolution display).
	 *	@type {number}
	 */
	PixelRatio: (() => {
		return Number(window.devicePixelRatio) >= 1.5 ? 2 : 1;
	})(),

	/**
	 *	Add element to the array if it is not already present.
	 *
	 *	@param {Array.<*>} array
	 *	@param {*} element
	 */
	pushUnique( array, element ) {
		if (array.indexOf(element) == -1) {
			array.push(element);
		}
	}

};

module.exports = utils;