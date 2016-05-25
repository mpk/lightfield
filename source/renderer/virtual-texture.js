/**
 *	Texture atlas for frames
 */
var Texture = require('./objects/texture');
var Size = require('../utils/size');
var Vector2 = require('../utils/vector-2');

class VirtualTexture {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object} options - Texture options
	 *	@param {PageTable} pageTable
	 */
	constructor( ctx, options, pageTable ) {
		this.size = Size.fromObject(options);

		this.capacity = null;
		this.elements = null;
		this.elementSize = null;

		this.texture = new Texture(ctx, options);
		this.pageTable = pageTable;
	}

	/**
	 *	Update texture parameters.
	 *
	 *	@param {Size} frameSize
	 */
	reset( frameSize ) {
		this.elementSize = frameSize;
		this.capacity = Vector2.fromSize(this.size.divide(this.elementSize)).floor();
		this.elements = Array.from({ length: this.capacity.x * this.capacity.y });
	}

	/**
	 *	Upload frame to specified slot and update page table.
	 *
	 *	@param {number} slotIndex
	 *	@param {Frame} frame
	 */
	set( slotIndex, frame ) {
		this.elements[slotIndex] = frame;

		var x = slotIndex % this.capacity.x;
		var y = Math.floor(slotIndex / this.capacity.x);

		this.texture.putData(frame.resource, x * this.elementSize.width, y * this.elementSize.height);
		this.pageTable.set(frame, x, y);
	}

};

module.exports = VirtualTexture;