/**
 *	WebGL renderer
 */
var diff = require('arr-diff');
var Emitter = require('component-emitter');
var fs = require('fs');
var math = require('math');
var PageTable = require('./page-table');
var ShaderPass = require('./shader-pass');
var VirtualTexture = require('./virtual-texture');
var RenderTarget = require('./objects/render-target');
var Texture = require('./objects/texture');
var utils = require('../utils');
var Frame = require('../models/frame');
var Size = require('../utils/size');
var Vector2 = require('../utils/vector-2');

class Renderer {

	/**
	 *	@param {WebGLRenderingContext} ctx
	 *	@param {number} maxTextureSize
	 */
	constructor( ctx, maxTextureSize ) {
		this.ctx = ctx;
		this.maxTextureSize = maxTextureSize;

		this.props = {};
		this.size = null;
		this.needsRender = false;

		this.handlePaint = this.handlePaint.bind(this);

		this.ctx.canvas.addEventListener('webglcontextlost', () => {
			console.error('WebGL context has been lost.');
			this.error = true;
			this.emit('contextlost');
		});

		// Initialize renderer objects
		this.virtualFrames = this.createVirtualFrames();
		this.error = !this.initPasses();

		// Start render loop
		this.handlePaint();
	}

	/**
	 *	Try to initialize renderer.
	 *
	 *	@param {HTMLCanvasElement} canvas
	 *	@return {?Renderer}
	 */
	static init( canvas ) {
		var ctx;

		try {
			ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		} catch ( ex ) {
			ctx = null;
		}

		if (ctx) {
			var maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
			if (maxTextureSize >= IntraTextureSizeLo) {
				var renderer = new Renderer(ctx, maxTextureSize);

				if (!renderer.error) {
					return renderer;
				} else {
					console.error('Cannot initialize renderer.');
					return null;
				}
			} else {
				console.error(`Maximum texture size is ${maxTextureSize}, but needs to be at least ${IntraTextureSizeLo}.`);
				return null;
			}
		} else {
			console.error('Cannot create WebGL context.');
			return null;
		}
	}

	/**
	 *	Request render of the file with the specified parameters.
	 *
	 *	@param {File} file
	 *	@param {number} aperture
	 *	@param {number} focus
	 *	@param {Vector2} viewpoint
	 */
	render( file, aperture, focus, viewpoint ) {
		if (this.props.file !== file) {
			this.pageTable.reset(file.matrixSize);
			this.intraTexture.reset(file.frameSize);
			this.predTexture.reset(file.frameSize.divideScalar(Frame.BlockSize));
		}

		this.props = { file, aperture, focus, viewpoint };
		this.size = Size.fromObject(this.ctx.canvas);
		this.needsRender = true;
	}

	/**
	 *	Calculate maximum possible aperture for the specified file (renderer limitations).
	 *	Render of the specified file has to be requested before calling this method.
	 *
	 *	@param {File} file
	 *	@return {number}
	 */
	getMaxAperture( file ) {
		var maxAperture = Math.min(file.maxViewpoint.x - 1, file.maxViewpoint.y - 1);
		var viewpoint = new Vector2(0.5, 0.5); // Force bilinear interpolation
		var testAperture = -1;
		var intraFrames;

		do {
			testAperture += 1;
			var frames = file.getFramesFor(testAperture, viewpoint);
			intraFrames = frames.filter(( frame ) => frame.type == Frame.Type.Intra);
		} while (intraFrames.length <= this.intraTexture.elements.length && testAperture < maxAperture);

		return math.clamp(testAperture - 1, 0, MaxAperture);
	}

	/**
	 *	@private
	 */
	createVirtualFrames() {
		var virtualFrames = [];

		for (let dy = -MaxAperture; dy < MaxAperture; dy += 1) {
			for (let dx = -MaxAperture; dx < MaxAperture; dx += 1) {
				var distance = Math.sqrt(dx ** 2 + dy ** 2);
				if (distance <= MaxAperture) {
					virtualFrames.push({ dx, dy, distance });
				}
			}
		}

		return virtualFrames.sort(( a, b ) => a.distance - b.distance);
	}

	/**
	 *	@private
	 *	@return {boolean}
	 */
	initPasses() {
		var intraTextureSize = Math.min(this.maxTextureSize, IntraTextureSizeHi);

		this.pageTable = new PageTable(this.ctx);

		this.intraTexture = new VirtualTexture(this.ctx, {
			format: Texture.Format.RGB,
			height: intraTextureSize,
			width: intraTextureSize
		}, this.pageTable);

		this.predTexture = new VirtualTexture(this.ctx, {
			height: PredTextureSize,
			width: PredTextureSize,
			magFilter: Texture.Filter.Nearest,
			minFilter: Texture.Filter.Nearest
		}, this.pageTable);

		var outputRT = new RenderTarget(this.ctx, {
			width: MaxFrameSize,
			height: MaxFrameSize,
			type: Texture.Type.AnyFloat
		});

		this.framePass = new ShaderPass(this.ctx, {
			blend: true,
			program: {
				vertexShader: fs.readFileSync(`${__dirname}/shaders/frame-vertex.glsl`, 'utf8'),
				fragmentShader: fs.readFileSync(`${__dirname}/shaders/frame-fragment.glsl`, 'utf8'),
				defines: {
					I_TEXTURE_SIZE: `vec2(${intraTextureSize}.0, ${intraTextureSize}.0)`,
					P_TEXTURE_SIZE: `vec2(${PredTextureSize}.0, ${PredTextureSize}.0)`,
					P_BLOCK_SIZE: Frame.BlockSize.toFixed(1),
					P_BLOCK_PRECISION: Frame.BlockPrecision.toFixed(1)
				},
				uniforms: {
					i_frames: this.intraTexture.texture,
					p_frames: this.predTexture.texture,
					page_table: this.pageTable.texture
				}
			},
			renderTarget: outputRT,
			vertices: {
				attributes: {
					position: utils.mapArray(this.virtualFrames, () => [[-1, -1], [1, -1], [1, 1], [-1, 1]]),
					offset: utils.mapArray(this.virtualFrames, ( frame ) => [[frame.dx, frame.dy], [frame.dx, frame.dy], [frame.dx, frame.dy], [frame.dx, frame.dy]])
				},
				indices: utils.mapArray(this.virtualFrames, ( frame, index ) => [index * 4, index * 4 + 1, index * 4 + 2, index * 4, index * 4 + 2, index * 4 + 3])
			}
		});

		this.outputPass = new ShaderPass(this.ctx, {
			program: {
				vertexShader: fs.readFileSync(`${__dirname}/shaders/output-vertex.glsl`, 'utf8'),
				fragmentShader: fs.readFileSync(`${__dirname}/shaders/output-fragment.glsl`, 'utf8'),
				uniforms: {
					composite: outputRT
				}
			},
			vertices: {
				attributes: {
					position: [[-1, -1], [1, -1], [-1, 1], [1, 1]]
				},
				indices: [0, 1, 2, 1, 3, 2]
			}
		});

		return this.framePass.isComplete() && this.outputPass.isComplete();
	}

	/**
	 *	@private
	 */
	handlePaint() {
		if (!this.error) {
			window.requestAnimationFrame(this.handlePaint);

			if (this.props.file) {
				if (this.needsRender) {
					var frames = this.props.file.getFramesFor(this.props.aperture, this.props.viewpoint);

					this.updateTextures(frames);

					this.pageTable.upload();
					this.renderPasses();
					this.needsRender = false;
				} else {
					// Upload frames to GPU memory that might be necessary in the future while idle
					var closestFrames = this.props.file.getClosestFrames(this.props.viewpoint);

					this.updateTextures(closestFrames, 2);
				}
			}
		}
	}

	/**
	 *	Put specified frames to corresponding virtual textures in GPU memory.
	 *
	 *	@private
	 *	@param {Array.<Frame>} frames
	 *	@param {number} maxUploads
	 */
	updateTextures( frames, maxUploads = Infinity ) {
		this.updateTexture(this.intraTexture, frames.filter(( frame ) => frame.type == Frame.Type.Intra), maxUploads);
		this.updateTexture(this.predTexture, frames.filter(( frame ) => frame.type == Frame.Type.Predicted), maxUploads);
	}

	/**
	 *	Put specified frames to virtual texture in GPU memory.
	 *	If the virtual texture is full, it evicts frames that are not specified in the frames array.
	 *
	 *	@private
	 *	@param {VirtualTexture} texture
	 *	@param {Array.<Frame>} frames
	 *	@param {number} maxUploads
	 */
	updateTexture( texture, frames, maxUploads ) {
		var newFrames = diff(frames, texture.elements);

		texture.elements.forEach(( frame, elementIndex ) => {
			if (newFrames.length > 0 && maxUploads > 0 && frames.indexOf(frame) == -1) {
				texture.set(elementIndex, newFrames.shift());
				maxUploads -= 1;
			}
		});
	}

	/**
	 *	@private
	 */
	renderPasses() {
		var frameCount = this.virtualFrames.filter(( frame ) => frame.distance <= this.props.aperture).length;
		var outputSize = Size.min(this.props.file.frameSize, this.size);

		this.framePass.set('frame_count', frameCount);
		this.framePass.set('focus', this.props.focus);
		this.framePass.set('viewpoint', this.props.viewpoint);
		this.framePass.set('frame_size', this.props.file.frameSize);
		this.framePass.set('page_table_size', this.pageTable.size);
		this.framePass.set('viewpoint_max', this.props.file.maxViewpoint);
		this.framePass.set('resolution', this.size);

		this.framePass.render({
			triangleCount: frameCount * 2,
			viewport: outputSize
		});

		this.outputPass.set('output_size', outputSize);
		this.outputPass.set('max_frame_size', MaxFrameSize);

		this.outputPass.render({
			triangleCount: 2,
			viewport: this.size
		});
	}

};

Emitter(Renderer.prototype);

Renderer.Error = {};
Renderer.Error.Crash = 'Crash';
Renderer.Error.InitFailure = 'InitFailure';

const IntraTextureSizeLo = 4096;
const IntraTextureSizeHi = 8192;
const PredTextureSize = 1024;
const MaxFrameSize = 1024;
const MaxAperture = 4;

module.exports = Renderer;