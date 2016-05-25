/**
 *	Horizontal slider
 */
var math = require('math');
var React = require('react');
var cx = require('../utils/class-names')('lfv-slider');
var Tappable = require('../utils/tappable');

class Slider extends React.Component {

	constructor() {
		super();

		this.state = {
			active: false
		};
	}

	render() {
		var handleLeftOffset = math.mapLinearClamp(this.props.value, this.props.minValue, this.props.maxValue, 0, 100);

		return (
			<Tappable className={cx(null, { 'active': this.state.active })} onTap={this.handleTap.bind(this)}>
				<div className={cx('track')} ref="track" style={{ width: this.props.width }}>
					{(!this.props.disabled) ?
						<Tappable
							className = {cx('handle-container')}
							onPointerPress = {this.handlePointerPress.bind(this)}
							onPointerMove = {this.handlePointerMove.bind(this)}
							onPointerRelease = {this.handlePointerRelease.bind(this)}
							style = {{ left: handleLeftOffset + '%' }}>
								<div className={cx('handle')}></div>
						</Tappable>
						: null}
				</div>
			</Tappable>
		);
	}

	handlePointerPress( event ) {
		this.startValue = this.props.value;
		this.trackStepSize = this.refs.track.clientWidth / (this.props.maxValue - this.props.minValue) * this.props.step;

		this.setState({ active: true });
	}

	handlePointerMove( event ) {
		var dtStep = Math.round(event.startDtX / this.trackStepSize);

		var newValue = math.clamp(this.startValue + dtStep * this.props.step, this.props.minValue, this.props.maxValue);
		if (newValue != this.props.value) {
			this.props.onChange.call(this, newValue);
		}
	}

	handlePointerRelease() {
		this.setState({ active: false });
	}

	handleTap( event ) {
		if (!this.props.disabled) {
			var trackOffset = this.refs.track.getBoundingClientRect().left;

			var newValue = math.roundToNearest(math.mapLinearClamp(event.clientX - trackOffset, 0, this.refs.track.clientWidth,
				this.props.minValue, this.props.maxValue), this.props.step);

			this.props.onChange.call(this, newValue);
		}
	}

};

module.exports = Slider;