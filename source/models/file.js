/**
 *	Lightfield "file" (consists of manifest, frames, depth map)
 */
var DepthMap = require('./depth-map');
var Frame = require('./frame');
var utils = require('../utils');
var Interval = require('../utils/interval');
var Size = require('../utils/size');
var Vector2 = require('../utils/vector-2');

class File {

	/**
	 *	@param {object} manifest
	 *	@param {Array.<HTMLImageElement>} frames
	 *	@param {HTMLImageElement} depthMap
	 */
	constructor( manifest, frames, depthMap ) {
		this.frameSize = Size.fromObject(manifest.frame);
		this.matrixSize = Size.fromObject(manifest.matrix);
		this.focusInterval = Interval.fromObject(manifest.focus);
		this.maxViewpoint = Vector2.fromSize(this.matrixSize).divideScalar(2).floor();

		this.frames = frames.map(( resource, index ) => new Frame(index, resource, this.matrixSize));
		this.depthMap = new DepthMap(depthMap);

		// Only for use in getClosestFrames() method
		this.tmpFrames = this.frames.slice(0);
	}

	/**
	 *	Get frame by its position.
	 *
	 *	@param {number} x
	 *	@param {number} y
	 *	@return {Frame}
	 */
	getFrameByPosition( x, y ) {
		return this.frames[Math.floor(this.frames.length / 2) + Math.round(y) * this.matrixSize.width + Math.round(x)];
	}

	/**
	 *	Get frames necessary to render result with the provided parameters.
	 *
	 *	@param {number} aperture
	 *	@param {Vector2} viewpoint
	 *	@return {Array.<Frame>}
	 */
	getFramesFor( aperture, viewpoint ) {
		var v1 = viewpoint.floor();
		var v2 = viewpoint.ceil();
		var intAperture = Math.ceil(aperture);

		var frames = [];

		for (let dy = -intAperture; dy <= intAperture; dy += 1) {
			for (let dx = -intAperture; dx <= intAperture; dx += 1) {
				if (Math.sqrt(dx ** 2 + dy ** 2) <= aperture) {
					// Frames for bilinear interpolation
					var f11 = this.getFrameByPosition(v1.x + dx, v1.y + dy);
					var f12 = this.getFrameByPosition(v1.x + dx, v2.y + dy);
					var f21 = this.getFrameByPosition(v2.x + dx, v1.y + dy);
					var f22 = this.getFrameByPosition(v2.x + dx, v2.y + dy);

					[f11, f12, f21, f22].forEach(( frame ) => {
						utils.pushUnique(frames, frame);
						frame.sources.forEach(( sourceIndex ) => {
							utils.pushUnique(frames, this.frames[sourceIndex]);
						});
					});
				}
			}
		}

		return frames;
	}

	/**
	 *	Get sorted frames (from closest to farthest).
	 *
	 *	@param {Vector2} viewpoint
	 *	@return {Array.<Frame>}
	 */
	getClosestFrames( viewpoint ) {
		return this.tmpFrames.sort(( a, b ) => a.position.getSquaredDistanceTo(viewpoint)
			> b.position.getSquaredDistanceTo(viewpoint) ? 1 : -1);
	}

	/**
	 *	Retrieve ideal focus value at the specified offset.
	 *
	 *	@param {Vector2} offset
	 *	@return {number}
	 */
	getFocusAt( offset ) {
		return this.depthMap.getValueAt(offset);
	}

};

module.exports = File;