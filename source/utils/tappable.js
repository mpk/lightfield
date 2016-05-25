/**
 *	Tappable React component
 *	@see https://github.com/JedWatson/react-tappable
 */
var React = require('react');

class Tappable extends React.Component {

	constructor() {
		super();

		this.startX = 0;
		this.startY = 0;

		this.prevX = 0;
		this.prevY = 0;

		this.distX = 0;
		this.distY = 0;

		this.pressTarget = null;
		this.onlyTouch = true;
	}

	render() {
		var thisProps = {};

		PropsToCopy.forEach(( name ) => thisProps[name] = this.props[name]);

		thisProps.style = Object.assign({}, TouchStyles, this.props.style);

		thisProps.ref = 'nativeElement';

		if (HasTouchSupport) {
			thisProps.onTouchStart = this.handlePointerPress.bind(this);
			thisProps.onTouchMove = this.handlePointerMove.bind(this);
			thisProps.onTouchEnd = this.handlePointerRelease.bind(this);
		} else {
			thisProps.onMouseDown = this.handlePointerPress.bind(this);
		}

		return React.createElement(this.props.component || 'div', thisProps, this.props.children);
	}

	/**
	 *	Get reference to wrapped DOM element.
	 *
	 *	@return {Element}
	 */
	getElement() {
		return this.refs.nativeElement;
	}

	/**
	 *	@private
	 */
	handlePointerPress( event ) {
		var pointer = this.getPointer(event);

		if (HasTouchSupport) {
			this.onlyTouch = (event.touches.length == 1);
		} else {
			document.addEventListener('mousemove', this.fnPointerMove = this.handlePointerMove.bind(this));
			document.addEventListener('mouseup', this.fnPointerRelease = this.handlePointerRelease.bind(this));
		}

		if (this.onlyTouch) {
			this.startX = this.prevX = pointer.clientX;
			this.startY = this.prevY = pointer.clientY;

			this.distX = 0;
			this.distY = 0;

			this.pressTarget = event.target;

			if (this.props.onPointerPress) {
				this.props.onPointerPress.call(this);
			}

			event.stopPropagation();
			event.preventDefault();
		}
	}

	/**
	 *	@private
	 */
	handlePointerMove( event ) {
		var pointer = this.getPointer(event);

		if (this.onlyTouch) {
			var dtX = pointer.clientX - this.prevX;
			var dtY = pointer.clientY - this.prevY;

			var startDtX = pointer.clientX - this.startX;
			var startDtY = pointer.clientY - this.startY;

			this.distX += Math.abs(dtX);
			this.distY += Math.abs(dtY);

			this.prevX = pointer.clientX;
			this.prevY = pointer.clientY;

			// Do not apply threshold if tap event listener does not exist
			if (!this.props.onTap || this.distX + this.distY >= PressDistanceThreshold) {
				if (this.props.onPointerMove) {
					this.props.onPointerMove.call(this, { dtX, dtY, startDtX, startDtY });
				}
			}

			// Do not prevent page movement if event listener does not exist
			if (this.props.onPointerMove) {
				event.preventDefault();
			}
		}
	}

	/**
	 *	@private
	 */
	handlePointerRelease( event ) {
		var pointer = this.getPointer(event);

		if (!HasTouchSupport) {
			document.removeEventListener('mousemove', this.fnPointerMove);
			document.removeEventListener('mouseup', this.fnPointerRelease);
		}

		if (this.onlyTouch) {
			if (this.distX + this.distY < PressDistanceThreshold) {
				if (this.props.onTap) {
					this.props.onTap.call(this, {
						pageX: pointer.pageX,
						pageY: pointer.pageY,
						clientX: pointer.clientX,
						clientY: pointer.clientY,
						target: this.pressTarget
					});
				}
			}

			if (this.props.onPointerRelease) {
				this.props.onPointerRelease.call(this);
			}

			this.pressTarget = null;
		}
	}

	/**
	 *	Retrieve object that contains clientX/pageX/... keys.
	 *
	 *	@private
	 */
	getPointer( event ) {
		if (HasTouchSupport) {
			if (event.targetTouches.length) {
				return event.targetTouches[0];
			} else if (event.changedTouches.length) {
				return event.changedTouches[0];
			}
		} else {
			return event;
		}
	}

};

const HasTouchSupport = ('ontouchstart' in window);

const PropsToCopy = ['className', 'height', 'style', 'title', 'width'];
const TouchStyles = {
	WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
	WebkitTouchCallout: 'none'
};
const PressDistanceThreshold = 16;

module.exports = Tappable;