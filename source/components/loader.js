/**
 *	Loading indicator
 */
var math = require('math');
var React = require('react');
var utils = require('../utils');
var cx = require('../utils/class-names')('lfv-loader');

class Loader extends React.Component {

	componentDidMount() {
		this.ctx = this.refs.canvas.getContext('2d');
		this.ctx.scale(utils.PixelRatio, utils.PixelRatio);

		this.paint();
	}

	render() {
		return (
			<div className={cx()}>
				<canvas className={cx('canvas')} ref="canvas" width={Size * utils.PixelRatio} height={Size * utils.PixelRatio}></canvas>
				<div className={cx('text')}>{`${Math.floor(this.props.value * 100)} %`}</div>
			</div>
		);
	}

	componentDidUpdate() {
		this.paint();
	}

	paint() {
		this.ctx.clearRect(0, 0, Size, Size);

		// Background circle
		this.paintArc(BackColor, 0, Math.PI * 2);

		// Progress arc
		var endAngle = math.mapLinear(this.props.value, 0, 1, -Math.PI / 2, Math.PI * 1.5);
		this.paintArc(Color, -Math.PI / 2, endAngle);

		// Dot
		this.ctx.fillStyle = Color;
		this.ctx.beginPath();
		this.ctx.arc(Size / 2 + Math.cos(endAngle) * Radius, Size / 2 + Math.sin(endAngle) * Radius, DotRadius, 0, Math.PI * 2);
		this.ctx.fill();
	}

	paintArc( strokeStyle, startAngle, endAngle ) {
		this.ctx.strokeStyle = strokeStyle;
		this.ctx.lineWidth = StrokeSize;

		this.ctx.beginPath();
		this.ctx.arc(Size / 2, Size / 2, Radius, startAngle, endAngle);
		this.ctx.stroke();
	}

};

const BackColor = '#2e2f35';
const Color = '#0ab783';
const Size = 128;
const StrokeSize = 4;
const Radius = 42;
const DotRadius = 4;

module.exports = Loader;