/**
 *	WebGL index buffer abstraction
 */
class IndexBuffer {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {Array.<number>} indices
	 */
	constructor( ctx, indices ) {
		this.ctx = ctx;

		this.resource = this.createResource(indices);
	}

	/**
	 *	Bind the resource.
	 */
	bind() {
		this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, this.resource);
	}

	/**
	 *	@private
	 *	@param {Array.<number>} indices
	 *	@return {WebGLBuffer}
	 */
	createResource( indices ) {
		var resource = this.ctx.createBuffer();

		this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, resource);
		this.ctx.bufferData(this.ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.ctx.STATIC_DRAW);

		return resource;
	}

};

module.exports = IndexBuffer;