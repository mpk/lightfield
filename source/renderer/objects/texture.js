/**
 *	WebGL texture abstraction
 */
class Texture {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object=} options
	 *	@param {Texture.Format=} options.format - Texture format (default is Format.RGBA)
	 *	@param {Texture.Type=} options.type - Texture type (default is Type.UnsignedByte)
	 *	@param {Texture.Filter=} options.magFilter - Magnification filter (default is Filter.Linear)
	 *	@param {Texture.Filter=} options.minFilter - Minification filter (default is Filter.Linear)
	 *	@param {Texture.WrapMode=} options.wrapS - Wrap mode in S coordinate (default is WrapMode.Clamp)
	 *	@param {Texture.WrapMode=} options.wrapT - Wrap mode in T coordinate (default is WrapMode.Clamp)
	 *	@param {number=} options.width
	 *	@param {number=} options.height
	 */
	constructor( ctx, options = {} ) {
		this.ctx = ctx;

		this.format = options.format || Texture.Format.RGBA;
		this.type = options.type || Texture.Type.UnsignedByte;
		this.magFilter = options.magFilter || Texture.Filter.Linear;
		this.minFilter = options.minFilter || Texture.Filter.Linear;
		this.wrapS = options.wrapS || Texture.WrapMode.Clamp;
		this.wrapT = options.wrapT || Texture.WrapMode.Clamp;

		this.resource = this.createResource();

		if (options.width !== undefined && this.resource) {
			// Allocate GPU memory if width and height are specified
			this.setData(null, options.width, options.height);
		}
	}

	/**
	 *	Bind this texture to specified texture unit.
	 *
	 *	@param {number} index
	 */
	setTextureUnit( index ) {
		this.ctx.activeTexture(this.ctx.TEXTURE0 + index);
		this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.resource);
	}

	/**
	 *	Replace the texture data (if Uint8Array is provided, width and height parameters must be specified).
	 *
	 *	@param {?HTMLImageElement|Uint8Array} data
	 *	@param {number=} width
	 *	@param {number=} height
	 */
	setData( data, width, height ) {
		this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.resource);

		if (width === undefined) {
			this.ctx.texImage2D(this.ctx.TEXTURE_2D, 0, this.ctx[this.format], this.ctx[this.format], this.getTypeConst(), data);
		} else {
			this.ctx.texImage2D(this.ctx.TEXTURE_2D, 0, this.ctx[this.format], width, height, 0, this.ctx[this.format], this.getTypeConst(), data);
		}
	}

	/**
	 *	Update part of the texture with new data (if Uint8Array is provided, width and height parameters must be specified).
	 *
	 *	@param {HTMLImageElement|Uint8Array} data
	 *	@param {number} x
	 *	@param {number} y
	 *	@param {number=} width
	 *	@param {number=} height
	 */
	putData( data, x, y, width, height ) {
		this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.resource);

		if (width === undefined) {
			this.ctx.texSubImage2D(this.ctx.TEXTURE_2D, 0, x, y, this.ctx[this.format], this.getTypeConst(), data);
		} else {
			this.ctx.texSubImage2D(this.ctx.TEXTURE_2D, 0, x, y, width, height, this.ctx[this.format], this.getTypeConst(), data);
		}
	}

	/**
	 *	@private
	 *	@return {?WebGLTexture}
	 */
	createResource() {
		var resource = this.ctx.createTexture();
		this.ctx.bindTexture(this.ctx.TEXTURE_2D, resource);

		this.ctx.pixelStorei(this.ctx.UNPACK_FLIP_Y_WEBGL, true);
		this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.ctx[this.magFilter]);
		this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx[this.minFilter]);
		this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx[this.wrapS]);
		this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx[this.wrapT]);

		this.extensions = this.checkExtensions();
		if (!this.extensions) {
			return null;
		}

		return resource;
	}

	/**
	 *	Get necessary extensions.
	 *
	 *	@private
	 *	@return {?object}
	 */
	checkExtensions() {
		var extensions = {};

		if (this.type == Texture.Type.AnyFloat) {
			extensions.halfFloat = this.ctx.getExtension('OES_texture_half_float');
			extensions.float = this.ctx.getExtension('OES_texture_float');

			if (!extensions.halfFloat && !extensions.float) {
				console.error('Both OES_texture_half_float and OES_texture_float extensions are unavailable.');
				return null;
			}

			if (this.magFilter == Texture.Filter.Linear || this.minFilter == Texture.Filter.Linear) {
				extensions.halfFloatLinear = this.ctx.getExtension('OES_texture_half_float_linear');
				extensions.floatLinear = this.ctx.getExtension('OES_texture_float_linear');

				if (!extensions.halfFloatLinear && !extensions.floatLinear) {
					console.error('Both OES_texture_half_float_linear and OES_texture_float_linear extensions are unavailable.');
					return null;
				}
			}
		}

		return extensions;
	}

	/**
	 *	@private
	 *	@return {number}
	 */
	getTypeConst() {
		if (this.type == Texture.Type.AnyFloat) {
			if (this.extensions.halfFloat) {
				return this.extensions.halfFloat.HALF_FLOAT_OES;
			} else {
				return this.ctx.FLOAT;
			}
		} else {
			return this.ctx[this.type];
		}
	}

};

Texture.Filter = {};
Texture.Filter.Linear = 'LINEAR';
Texture.Filter.Nearest = 'NEAREST';

Texture.Format = {};
Texture.Format.RGB = 'RGB';
Texture.Format.RGBA = 'RGBA';

Texture.Type = {};
Texture.Type.UnsignedByte = 'UNSIGNED_BYTE';
Texture.Type.AnyFloat = 'ANY_FLOAT';

Texture.WrapMode = {};
Texture.WrapMode.Clamp = 'CLAMP_TO_EDGE';
Texture.WrapMode.Repeat = 'REPEAT';

module.exports = Texture;