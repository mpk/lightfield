/**
 *	WebGL attribute abstraction
 */
var flatten = require('arr-flatten');

class Attribute {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object} options
	 *	@param {number} options.location
	 *	@param {Array.<Array.<number>>} options.values
	 */
	constructor( ctx, options ) {
		this.ctx = ctx;

		this.location = options.location;
		this.size = options.values[0].length;

		this.resource = this.createResource(options.values);
	}

	/**
	 *	Bind the resource.
	 */
	bind() {
		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.resource);
		this.ctx.vertexAttribPointer(this.location, this.size, this.ctx.FLOAT, false, 0, 0);
	}

	/**
	 *	@private
	 *	@param {Array.<Array.<number>>} values
	 *	@return {WebGLBuffer}
	 */
	createResource( values ) {
		var resource = this.ctx.createBuffer();

		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, resource);
		this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(flatten(values)), this.ctx.STATIC_DRAW);
		this.ctx.enableVertexAttribArray(this.location);

		return resource;
	}

};

module.exports = Attribute;