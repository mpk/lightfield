/**
 *	Bottom control bar
 */
var math = require('math');
var React = require('react');
var screenfull = require('screenfull');
var Button = require('./button');
var Slider = require('./slider');
var constants = require('../constants');
var strings = require('../strings');
var cx = require('../utils/class-names')('lfv-controls');

class Controls extends React.Component {

	render() {
		var minFocus = this.props.file ? this.props.file.focusInterval.min : 0;
		var maxFocus = this.props.file ? this.props.file.focusInterval.max : 1;

		// Adjust controls (sliders, buttons) position in control bar according to viewer size
		var sliderWidth;
		var controlsRowWidth;

		if (this.props.size.width >= constants.MinOneRowWidth) {
			sliderWidth = Math.floor(math.mapLinearClamp(this.props.size.width, constants.MinOneRowWidth, constants.MaxOneRowWidth,
				constants.MinSliderWidth, constants.MaxSliderWidth));
			controlsRowWidth = math.clamp(this.props.size.width, constants.MinOneRowWidth, constants.MaxOneRowWidth);
		} else {
			sliderWidth = math.mapLinearClamp(this.props.size.width, constants.MinSize.width, constants.MaxTwoRowWidth,
				constants.MinSliderWidth, constants.MaxSliderWidth);
			controlsRowWidth = math.clamp(this.props.size.width, constants.MinSize.width, constants.MaxTwoRowWidth);
		}

		var focusSlider = (
			<div className={cx('slider')}>
				<svg className={cx('icon', 'focus')}>
					<path d="M14,22 l0,-8 c0,0,6,-3,6,-6 c0,-3,-2,-6,-2,-6 l-2,4 l-3,-4 l-3,4 l-2,-4 c0,0,-2,3,-2,6
						c0,3,6,6,6,6 l0,8 l-10,-8 c0,0,0,10,7,10 l8,0 c7,0,7,-10,7,-10 Z"></path>
				</svg>
				<Slider
					onChange = {this.handleFocusChange.bind(this)}
					minValue = {minFocus}
					maxValue = {maxFocus}
					value = {this.props.focus}
					step = {0.1}
					disabled = {this.props.disabled}
					width = {sliderWidth} />
				<svg className={cx('icon', 'focus')}>
					<path d="M16,2 l9,20 l-17,0 Z"></path>
					<path d="M6,10 l3,5 l-3,7 l-5,0 Z"></path>
				</svg>
				<div>{strings.Focus}</div>
			</div>
		);

		var apertureSlider = (
			<div className={cx('slider')}>
				<svg className={cx('icon', 'aperture')}>
					<circle cx="13" cy="13" r="12"></circle>
					<path d="M11,9 l4,0 l3,4 l-3,4 l-4,0 l-3,-4 Z"></path>
					<line x1="9" y1="13" x2="18" y2="1"></line>
					<line x1="12" y1="9.5" x2="25" y2="9.5"></line>
					<line x1="14" y1="9" x2="23" y2="21"></line>
					<line x1="17" y1="13" x2="8" y2="25"></line>
					<line x1="14" y1="16.5" x2="1" y2="16.5"></line>
					<line x1="12" y1="17" x2="3" y2="5"></line>
				</svg>
				<Slider
					onChange = {this.handleApertureChange.bind(this)}
					minValue = {0}
					maxValue = {this.props.maxAperture}
					value = {this.props.aperture}
					step = {0.1}
					disabled = {this.props.disabled}
					width = {sliderWidth} />
				<svg className={cx('icon', 'aperture')}>
					<circle cx="13" cy="13" r="12"></circle>
					<path d="M10,6 l6,0 l5,7 l-5,7 l-6,0 l-5,-7 Z"></path>
					<line x1="6" y1="13" x2="16" y2="-3"></line>
					<line x1="13" y1="6.5" x2="25" y2="6.5"></line>
					<line x1="15" y1="6" x2="25" y2="20"></line>
					<line x1="20" y1="13" x2="10" y2="27"></line>
					<line x1="14" y1="19.5" x2="1" y2="19.5"></line>
					<line x1="11" y1="20" x2="1" y2="6"></line>
				</svg>
				<div>{strings.Aperture}</div>
			</div>
		);

		var screenButton = (
			<div className={cx('button')}>
				<Button onTap={this.handleFullscreenTap.bind(this)} disabled={this.props.disabled} title={strings.Fullscreen}>
					{this.props.fullscreen ?
						<svg className={cx('button-icon', 'screen')}>
							<path d="M1,5 l4,0 l0,-4"></path>
							<path d="M13,5 l-4,0 l0,-4"></path>
							<path d="M1,9 l4,0 l0,4"></path>
							<path d="M13,9 l-4,0 l0,4"></path>
						</svg>
						: <svg className={cx('button-icon', 'screen')}>
							<path d="M2,6 l0,-4 l4,0"></path>
							<path d="M12,6 l0,-4 l-4,0"></path>
							<path d="M2,8 l0,4 l4,0"></path>
							<path d="M12,8 l0,4 l-4,0"></path>
						</svg>}
				</Button>
			</div>
		);

		var helpButton = (
			<div className={cx('button')}>
				<Button onTap={this.handleHelpTap.bind(this)} disabled={this.props.disabled} active={this.props.helpVisible} title={strings.Help}>
					<svg className={cx('button-icon', 'help')}>
						<path d="M4,4 c0,0 0,-3 3,-3 c2,0 3,2 3,3 c0,2 -3,3 -3,4 l0,2"></path>
						<rect x="6" y="12" width="2" height="2"></rect>
					</svg>
				</Button>
			</div>
		);

		if (this.props.size.width >= constants.MinOneRowWidth) {
			// Arrange controls in one row by default
			return (
				<div className={cx()}>
					<div className={cx('row')} style={{ width: controlsRowWidth }}>
						{focusSlider}
						{apertureSlider}
						{screenfull.enabled ?
							screenButton
							: null}
						{helpButton}
					</div>
				</div>
			);
		} else {
			// If the container is too narrow, arrange controls in two rows
			return (
				<div className={cx()}>
					<div className={cx('row')} style={{ width: controlsRowWidth }}>
						{focusSlider}
						{screenfull.enabled ?
							screenButton
							: null}
					</div>
					<div className={cx('row')} style={{ width: controlsRowWidth }}>
						{apertureSlider}
						{helpButton}
					</div>
				</div>
			);
		}
	}

	handleApertureChange( value ) {
		this.props.actions.setAperture(value);
	}

	handleFocusChange( value ) {
		this.props.actions.setFocus(value);
	}

	handleFullscreenTap() {
		this.props.actions.setFullscreen(!this.props.fullscreen);
	}

	handleHelpTap() {
		this.props.actions.toggleHelp();
	}

};

module.exports = Controls;