/**
 *	WebGL render target abstraction
 */
var Texture = require('./texture');

class RenderTarget {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object} options
	 *	@param {number} options.width
	 *	@param {number} options.height
	 *	@param {Texture.Type=} options.type - Texture type (default is Texture.Type.UnsignedByte)
	 */
	constructor( ctx, options ) {
		this.ctx = ctx;

		this.texture = new Texture(this.ctx, {
			width: options.width,
			height: options.height,
			type: options.type || Texture.Type.UnsignedByte
		});

		if (this.texture.resource) {
			this.resource = this.createResource();
		} else {
			this.resource = null;
		}
	}

	/**
	 *	Bind the attached texture to specified texture unit.
	 *
	 *	@param {number} index
	 */
	setTextureUnit( index ) {
		this.texture.setTextureUnit(index);
	}

	/**
	 *	@private
	 *	@return {?WebGLFramebuffer}
	 */
	createResource() {
		var resource = this.ctx.createFramebuffer();
		this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, resource);
		this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.texture.resource);
		this.ctx.framebufferTexture2D(this.ctx.FRAMEBUFFER, this.ctx.COLOR_ATTACHMENT0, this.ctx.TEXTURE_2D, this.texture.resource, 0);

		var status = this.ctx.checkFramebufferStatus(this.ctx.FRAMEBUFFER);
		if (status !== this.ctx.FRAMEBUFFER_COMPLETE) {
			console.error(`Cannot create framebuffer (status: ${status}).`);
			return null;
		}

		return resource;
	}

};

module.exports = RenderTarget;