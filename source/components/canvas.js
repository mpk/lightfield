/**
 *	Display canvas
 */
var React = require('react');
var FocusMarker = require('./focus-marker');
var Help = require('./help');
var Loader = require('./loader');
var strings = require('../strings');
var Renderer = require('../renderer/renderer');
var cx = require('../utils/class-names')('lfv-canvas');
var Size = require('../utils/size');
var Tappable = require('../utils/tappable');

class Canvas extends React.Component {

	componentDidMount() {
		this.renderer = Renderer.init(this.refs.canvas);

		if (this.renderer) {
			this.renderer.on('contextlost', () => {
				this.props.actions.reportRendererError(Renderer.Error.Crash);
				this.renderer = null;
			});
		} else {
			// Renderer could not be initialized
			this.props.actions.reportRendererError(Renderer.Error.InitFailure);
		}
	}

	render() {
		var screenSize = this.props.file ? this.props.canvasSize.fit(this.props.file.frameSize) : new Size(1, 1);
		var screenTopOffset = this.props.file ? (this.props.canvasSize.height - screenSize.height) / 2 : 0;

		var errorIcon = (
			<svg className={cx('error-icon')}>
				<circle cx="16" cy="16" r="14"></circle>
				<circle cx="12" cy="12" r="2"></circle>
				<circle cx="20" cy="12" r="2"></circle>
				<path d="M10,21 c4,-3,8,-3,12,0"></path>
			</svg>
		);

		return (
			<Tappable className={cx()} style={this.props.canvasSize} onPointerMove={this.handlePointerMove.bind(this)} onTap={this.handleTap.bind(this)}>
				{this.props.rendererError ?
					<div className={cx('error')}>
						{errorIcon}
						{(this.props.rendererError == Renderer.Error.Crash) ?
							strings.RendererCrash
							: strings.RendererInitFailure}
						<div className={cx('error-note')}>
							{strings.RendererErrorNote}
						</div>
					</div>
					: null}

				{this.props.fileError ?
					<div className={cx('error')}>
						{errorIcon}
						{strings.FileError}
					</div>
					: null}

				<div className={cx('display-container')} style={{ ...screenSize, marginTop: screenTopOffset }}>
					{this.props.focusPosition ?
						<FocusMarker position={this.props.focusPosition} size={screenSize} />
						: null}

					<canvas className={cx('display')} ref="canvas" width={screenSize.width} height={screenSize.height}></canvas>
				</div>

				{this.props.helpVisible ?
					<Help actions={this.props.actions} maxSize={screenSize} />
					: null}

				{(this.props.loadProgress !== null) ?
					<Loader value={this.props.loadProgress} />
					: null}
			</Tappable>
		);
	}

	componentDidUpdate( prevProps ) {
		if (this.renderer && this.props.file) {
			// Render file only if necessary
			if (prevProps.file !== this.props.file || prevProps.aperture !== this.props.aperture
					|| prevProps.focus !== this.props.focus || prevProps.viewpoint !== this.props.viewpoint
					|| prevProps.size !== this.props.size) {
				this.renderer.render(this.props.file, this.props.aperture, this.props.focus, this.props.viewpoint);

				if (prevProps.file !== this.props.file) {
					// Report max available aperture for this file (aperture is limited by renderer)
					this.props.actions.setMaxAperture(this.renderer.getMaxAperture(this.props.file));
				}
			}
		}
	}

	handlePointerMove( event ) {
		if (this.renderer && this.props.file) {
			var stepSize = this.props.canvasSize.fit(this.props.file.matrixSize).divide(this.props.file.matrixSize);

			this.props.actions.setViewpoint(
				this.props.viewpoint.x - event.dtX / stepSize.width,
				this.props.viewpoint.y - event.dtY / stepSize.height
			);
		}
	}

	handleTap( event ) {
		if (this.renderer && this.props.file) {
			var boundRect = this.refs.canvas.getBoundingClientRect();

			var offsetX = (event.clientX - boundRect.left) / boundRect.width;
			var offsetY = (event.clientY - boundRect.top) / boundRect.height;

			if (event.target == this.refs.canvas) {
				this.props.actions.focusAt(offsetX, offsetY);
			}
		}
	}

};

module.exports = Canvas;