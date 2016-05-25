/**
 *	Depth map
 */
var math = require('math');
var utils = require('../utils');
var Size = require('../utils/size');

class DepthMap {

	/**
	 *	@param {HTMLImageElement} resource
	 */
	constructor( resource ) {
		// Extract values from the image
		var imageData = utils.getImageData(resource);
		this.values = new Uint8Array(resource.width * resource.height);
		this.size = Size.fromObject(resource);

		for (let i = 0; i < this.values.length; i += 1) {
			this.values[i] = imageData[i * 4];
		}
	}

	/**
	 *	Retrieve value at the specified offset.
	 *
	 *	@param {Vector2} offset - Normalized offset from top-left corner
	 *	@return {number}
	 */
	getValueAt( offset ) {
		var offset = offset.multiplySize(this.size).floor();
		var value = this.values[offset.y * this.size.width + offset.x] || DefaultValue;

		return math.mapLinear(value, DefaultValue, DefaultValue + 1, 0, FocusStep);
	}

};

const DefaultValue = 128;
const FocusStep = 0.2;

module.exports = DepthMap;