/**
 *	Help window
 */
var React = require('react');
var strings = require('../strings');
var Button = require('../components/button');
var cx = require('../utils/class-names')('lfv-help');
var Tappable = require('../utils/tappable');

class Help extends React.Component {

	render() {
		var maxHeight = (this.props.maxSize.height * 0.8);

		return (
			<Tappable className={cx()} style={{ maxHeight: maxHeight + 'px' }}>
				<div className={cx('header')}>
					{strings.Help}
					<Button className={cx('close')} onTap={this.handleCloseTap.bind(this)} title={strings.Close}>
						<svg className={cx('icon-close')}>
							<line x1="2" y1="2" x2="12" y2="12"></line>
							<line x1="12" y1="2" x2="2" y2="12"></line>
						</svg>
					</Button>
				</div>

				<div className={cx('content')} style={{ maxHeight: (maxHeight - HeaderHeight) + 'px' }}>
					<table>
						<tr>
							<td colSpan="2">{strings.HelpIntro}</td>
						</tr>
						<tr>
							<td colSpan="2"><div className={cx('content-splitter')}></div></td>
						</tr>
						<tr>
							<td className={cx('content-title')}>{strings.Aperture}</td>
							<td>{strings.HelpAperture}</td>
						</tr>
						<tr>
							<td colSpan="2"><div className={cx('content-splitter')}></div></td>
						</tr>
						<tr>
							<td className={cx('content-title')}>{strings.Focus}</td>
							<td>{strings.HelpFocus}</td>
						</tr>
						<tr>
							<td colSpan="2"><div className={cx('content-splitter')}></div></td>
						</tr>
						<tr>
							<td className={cx('content-title')}>{strings.Viewpoint}</td>
							<td>{strings.HelpViewpoint}</td>
						</tr>
					</table>
				</div>
			</Tappable>
		);
	}

	handleCloseTap() {
		this.props.actions.toggleHelp();
	}

};

const HeaderHeight = 56;

module.exports = Help;