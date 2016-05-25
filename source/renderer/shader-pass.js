/**
 *	Standalone render pass
 */
var Attribute = require('./objects/attribute');
var IndexBuffer = require('./objects/index-buffer');
var Program = require('./objects/program');
var Uniform = require('./objects/uniform');

class ShaderPass {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object} options
	 *	@param {object} options.program
	 *	@param {object} options.vertices
	 *	@param {object} options.vertices.attributes
	 *	@param {Array.<number>} options.vertices.attributes.*
	 *	@param {Array.<number>} options.vertices.indices
	 *	@param {RenderTarget=} options.renderTarget
	 *	@param {boolean=} options.blend - Enable blending (default is false)
	 */
	constructor( ctx, options ) {
		this.ctx = ctx;

		this.blend = options.blend || false;
		this.renderTarget = options.renderTarget;

		this.program = new Program(this.ctx, options.program);

		this.attributes = [];
		for (let name in options.vertices.attributes) {
			this.attributes.push(new Attribute(this.ctx, {
				location: this.program.getAttributeLocation(name),
				values: options.vertices.attributes[name]
			}));
		}

		this.indexBuffer = new IndexBuffer(this.ctx, options.vertices.indices);
	}

	/**
	 *	Set uniform value.
	 *
	 *	@param {string} name
	 *	@param {*} value
	 */
	set( name, value ) {
		this.program.uniforms[name].value = value;
	}

	/**
	 *	Render this pass.
	 *
	 *	@param {object} options
	 *	@param {number} options.triangleCount
	 *	@param {object} options.viewport
	 *	@param {number} options.viewport.width
	 *	@param {number} options.viewport.height
	 */
	render( options ) {
		this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, this.renderTarget ? this.renderTarget.resource : null);
		this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);

		this.program.activate();

		for (let i = 0; i < this.attributes.length; i += 1) {
			this.attributes[i].bind();
		}
		this.indexBuffer.bind();

		this.ctx.viewport(0, 0, options.viewport.width, options.viewport.height);

		if (this.blend) {
			this.ctx.enable(this.ctx.BLEND);
			this.ctx.blendFunc(this.ctx.ONE, this.ctx.ONE);
		} else {
			this.ctx.disable(this.ctx.BLEND);
		}

		this.ctx.drawElements(this.ctx.TRIANGLES, options.triangleCount * 3, this.ctx.UNSIGNED_SHORT, 0);
	}

	/**
	 *	Check if all resources were created successfully.
	 *
	 *	@return {boolean}
	 */
	isComplete() {
		if (!this.program.resource) {
			return false;
		}

		if (this.renderTarget && !this.renderTarget.resource) {
			return false;
		}

		for (let name in this.program.uniforms) {
			var uniform = this.program.uniforms[name];

			if (uniform.type == Uniform.Type.Sampler && !uniform.value.resource) {
				return false;
			}
		}

		return true;
	}

};

module.exports = ShaderPass;