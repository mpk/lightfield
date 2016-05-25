/**
 *	Page table (frame position in virtual texture)
 */
var Texture = require('./objects/texture');
var Frame = require('../models/frame');
var Size = require('../utils/size');

class PageTable {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 */
	constructor( ctx ) {
		this.size = null;
		this.matrixSize = null;
		this.data = null;

		this.texture = new Texture(ctx, {
			format: Texture.Format.RGB,
			magFilter: Texture.Filter.Nearest,
			minFilter: Texture.Filter.Nearest
		});
	}

	/**
	 *	Update page table parameters.
	 *
	 *	@param {Size} matrixSize
	 */
	reset( matrixSize ) {
		this.matrixSize = matrixSize;
		this.size = this.matrixSize.toNextPowerOfTwo();
		this.data = new Uint8Array(this.size.width * this.size.height * RGBSize);
	}

	/**
	 *	Update page table for specified frame (set slot offset in virtual texture).
	 *
	 *	@param {Frame} frame
	 *	@param {number} x
	 *	@param {number} y
	 */
	set( frame, x, y ) {
		// Frame position (top-left origin)
		var topLeftX = frame.position.x + Math.floor(this.matrixSize.width / 2);
		var topLeftY = frame.position.y + Math.floor(this.matrixSize.height / 2);

		var offset = topLeftY * this.size.width * RGBSize + topLeftX * RGBSize;

		this.data[offset + 0] = x;
		this.data[offset + 1] = y;
		this.data[offset + 2] = (frame.type == Frame.Type.Intra) ? 0 : 255;
	}

	/**
	 *	Upload the texture data to GPU.
	 */
	upload() {
		this.texture.setData(this.data, this.size.width, this.size.height);
	}

};

const RGBSize = 3;

module.exports = PageTable;