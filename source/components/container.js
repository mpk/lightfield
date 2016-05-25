/**
 *	Parent container
 */
var React = require('react');
var reactRedux = require('react-redux');
var redux = require('redux');
var screenfull = require('screenfull');
var Canvas = require('./canvas');
var Controls = require('./controls');
var actions = require('../actions');
var constants = require('../constants');
var cx = require('../utils/class-names')('lfv-container');
var Size = require('../utils/size');

class Container extends React.Component {

	componentDidMount() {
		if (screenfull.enabled) {
			// Bind Fullscreen API events (change, error)
			document.addEventListener(screenfull.raw.fullscreenchange, () => {
				this.props.dispatch(actions.setFullscreen(screenfull.element == this.refs.container));
			});

			document.addEventListener(screenfull.raw.fullscreenerror, () => {
				this.props.dispatch(actions.setFullscreen(false));
			});
		}
	}

	componentWillReceiveProps( nextProps ) {
		// Request/cancel fullscreen
		if (this.props.fullscreen != nextProps.fullscreen) {
			nextProps.fullscreen ? screenfull.request(this.refs.container) : screenfull.exit();
		}
	}

	render() {
		var boundActions = redux.bindActionCreators(actions, this.props.dispatch);

		var size = this.props.fullscreen ? Size.fromObject(screen) : this.props.size;
		var canvasSize = this.getCanvasSize(size);

		return (
			<div className={cx()} ref="container" style={size}>
				<Canvas
					actions = {boundActions}
					file = {this.props.file}
					loadProgress = {this.props.loadProgress}
					fileError = {this.props.fileError}
					size = {size}
					canvasSize = {canvasSize}
					aperture = {this.props.aperture}
					focus = {this.props.focus}
					viewpoint = {this.props.viewpoint}
					focusPosition = {this.props.focusPosition}
					helpVisible = {this.props.helpVisible}
					rendererError = {this.props.rendererError} />

				<Controls
					actions = {boundActions}
					file = {this.props.file}
					size = {size}
					aperture = {this.props.aperture}
					focus = {this.props.focus}
					maxAperture = {this.props.maxAperture}
					fullscreen = {this.props.fullscreen}
					helpVisible = {this.props.helpVisible}
					disabled = {this.props.rendererError || this.props.fileError || !this.props.file} />
			</div>
		);
	}

	getCanvasSize( size ) {
		var controlsRows = (size.width >= constants.MinOneRowWidth) ? 1 : 2;

		return new Size(size.width, size.height - controlsRows * constants.ControlsHeight);
	}

};

module.exports = reactRedux.connect(( state ) => state)(Container);