/**
 *	Refocus click indicator
 */
var math = require('math');
var React = require('react');
var utils = require('../utils');
var cx = require('../utils/class-names')('lfv-focus-marker');
var Transition = require('../utils/transition');

class FocusMarker extends React.Component {

	constructor() {
		super();

		this.state = {
			progress: 1,
			visible: false
		};
	}

	componentDidMount() {
		this.ctx = this.refs.canvas.getContext('2d');
		this.ctx.scale(utils.PixelRatio, utils.PixelRatio);
	}

	componentWillReceiveProps( nextProps ) {
		if (this.props.position != nextProps.position) {
			Transition.start('FocusMarker', 0, 1, 750)
				.on('paint', ( value ) => this.setState({ progress: value, visible: true }))
				.on('end', () => this.setState({ visible: false }));
		}
	}

	render() {
		var style = {
			left: this.props.position.x * this.props.size.width - Size / 2,
			top: this.props.position.y * this.props.size.height - Size / 2
		};

		return (
			<canvas
				className = {cx(null, { 'hidden': !this.state.visible })}
				ref = "canvas"
				width = {Size * utils.PixelRatio}
				height = {Size * utils.PixelRatio}
				style = {style}>
			</canvas>
		);
	}

	componentDidUpdate() {
		this.ctx.clearRect(0, 0, Size, Size);

		var arcOffset = this.state.progress * (Size / 2);

		this.paintArc(arcOffset + 2);
		this.paintArc(arcOffset + 9);
		this.paintArc(arcOffset + 16);
	}

	paintArc( arcRadius ) {
		this.ctx.lineWidth = StrokeSize;

		this.ctx.beginPath();
		this.ctx.arc(Size / 2, Size / 2, arcRadius, 0, Math.PI * 2);
		this.ctx.strokeStyle = `rgba(255, 255, 255, ${math.mapLinearClamp(arcRadius, Size / 4, Size / 2, 1, 0)})`;
		this.ctx.stroke();
	}

};

const Size = 64;
const StrokeSize = 4;

module.exports = FocusMarker;