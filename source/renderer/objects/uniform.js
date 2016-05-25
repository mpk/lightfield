/**
 *	WebGL uniform abstraction
 */
class Uniform {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object} options
	 *	@param {number} options.location
	 *	@param {string} options.type
	 *	@param {*=} options.value
	 */
	constructor( ctx, options ) {
		this.ctx = ctx;

		this.location = options.location;
		this.type = options.type;
		this.value = options.value;
	}

	/**
	 *	Upload the value to GPU.
	 *
	 *	@param {number} nextTextureUnit - ID of next available texture unit
	 *	@return {number} - Number of texture units used in this call (0 or 1)
	 */
	upload( nextTextureUnit ) {
		var usedTextureUnits = 0;

		switch (this.type) {
			case Uniform.Type.Float:
				this.ctx.uniform1f(this.location, this.value);
				break;
			case Uniform.Type.Integer:
				this.ctx.uniform1i(this.location, this.value);
				break;
			case Uniform.Type.Vector2:
				if (this.value.x !== undefined) {
					this.ctx.uniform2f(this.location, this.value.x, this.value.y);
				} else if (this.value.width !== undefined) {
					this.ctx.uniform2f(this.location, this.value.width, this.value.height);
				}
				break;
			case Uniform.Type.Sampler:
				this.value.setTextureUnit(nextTextureUnit);
				this.ctx.uniform1i(this.location, nextTextureUnit);
				usedTextureUnits += 1;
				break;
		}

		return usedTextureUnits;
	}

};

Uniform.Type = {};
Uniform.Type.Float = 'float';
Uniform.Type.Integer = 'int';
Uniform.Type.Sampler = 'sampler2D';
Uniform.Type.Vector2 = 'vec2';

module.exports = Uniform;