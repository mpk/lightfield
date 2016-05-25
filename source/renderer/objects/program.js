/**
 *	WebGL program abstraction
 */
var Uniform = require('./uniform');

class Program {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {object} options
	 *	@param {string} options.vertexShader
	 *	@param {string} options.fragmentShader
	 *	@param {object=} options.defines
	 *	@param {object=} options.uniforms - Default uniform values
	 */
	constructor( ctx, options ) {
		this.ctx = ctx;

		this.vertexShader = this.setDefineValues(options.vertexShader, options.defines);
		this.fragmentShader = this.setDefineValues(options.fragmentShader, options.defines);

		this.resource = this.createResource();

		if (this.resource) {
			this.uniforms = this.createUniformList(options.uniforms);
		}
	}

	/**
	 *	Activate this program.
	 */
	activate() {
		this.ctx.useProgram(this.resource);

		var nextTextureUnit = 0;
		for (let name in this.uniforms) {
			nextTextureUnit += this.uniforms[name].upload(nextTextureUnit);
		}
	}

	/**
	 *	Get location of an attribute variable.
	 *
	 *	@param {string} name
	 *	@return {number}
	 */
	getAttributeLocation( name ) {
		return this.ctx.getAttribLocation(this.resource, name);
	}

	/**
	 *	@private
	 *	@return {?WebGLProgram}
	 */
	createResource() {
		var resource = this.ctx.createProgram();

		var vertexShader = this.createShaderResource(this.ctx.VERTEX_SHADER, this.vertexShader);
		var fragmentShader = this.createShaderResource(this.ctx.FRAGMENT_SHADER, this.fragmentShader);

		this.ctx.attachShader(resource, vertexShader);
		this.ctx.attachShader(resource, fragmentShader);
		this.ctx.linkProgram(resource);

		if (!this.ctx.getProgramParameter(resource, this.ctx.LINK_STATUS)) {
			console.error('Cannot link shaders.');
			console.error(this.ctx.getProgramInfoLog(resource));

			return null;
		}

		return resource;
	}

	/**
	 *	@private
	 *	@param {number} type - ctx.VERTEX_SHADER or ctx.FRAGMENT_SHADER
	 *	@param {string} source
	 *	@return {?WebGLShader}
	 */
	createShaderResource( type, source ) {
		var resource = this.ctx.createShader(type);

		this.ctx.shaderSource(resource, source);
		this.ctx.compileShader(resource);

		if (!this.ctx.getShaderParameter(resource, this.ctx.COMPILE_STATUS)) {
			console.error('Cannot compile shader.');
			console.error(this.ctx.getShaderInfoLog(resource));

			return null;
		}

		return resource;
	}

	/**
	 *	Create a list of uniform variables from source.
	 *
	 *	@private
	 *	@param {object=} defaults
	 *	@return {{ name: Uniform }}
	 */
	createUniformList( defaults = {} ) {
		var uniforms = {};

		(this.vertexShader + this.fragmentShader).replace(/uniform (\w+) (\w+)/g, ( match, type, name ) => {
			uniforms[name] = uniforms[name] || new Uniform(this.ctx, {
				location: this.ctx.getUniformLocation(this.resource, name),
				value: defaults[name],
				type: type
			});
		});

		return uniforms;
	}

	/**
	 *	Replace placeholder #define values with specified values.
	 *
	 *	@private
	 *	@param {string} source - Shader source
	 *	@param {{ name: value }} values
	 *	@return {string}
	 */
	setDefineValues( source, values ) {
		for (let name in values) {
			source = source.replace(`#define ${name} VALUE`, `#define ${name} ${values[name]}`);
		}

		return source;
	}

};

module.exports = Program;