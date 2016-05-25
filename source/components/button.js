/**
 *	Button
 */
var React = require('react');
var cx = require('../utils/class-names')('lfv-button');
var Tappable = require('../utils/tappable');

class Button extends React.Component {

	render() {
		return (
			<Tappable
				className = {cx(null, { 'disabled': this.props.disabled, 'active': this.props.active }) + ' ' + this.props.className}
				onTap = {this.handleTap.bind(this)}
				title = {this.props.title}>
					{this.props.children}
			</Tappable>
		);
	}

	handleTap( event ) {
		if (this.props.onTap && !this.props.disabled) {
			this.props.onTap(event);
		}
	}

};

module.exports = Button;