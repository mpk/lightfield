/**
 *	Transition
 */
var Emitter = require('component-emitter');
var math = require('math');

class Transition {

	/**
	 *	@param {number} valueFrom
	 *	@param {number} valueTo
	 *	@param {number} duration - Transition duration in ms
	 *	@param {Transition.Easing=} easing
	 */
	constructor( valueFrom, valueTo, duration, easing = Transition.Easing.Linear ) {
		this.valueFrom = valueFrom;
		this.valueTo = valueTo;

		this.startTime = Date.now();
		this.stopTime = this.startTime + duration;

		this.easing = easing;

		this.active = true;

		this.handlePaint = this.handlePaint.bind(this);
		this.handlePaint();
	}

	/**
	 *	Stop this transition.
	 */
	stop() {
		this.active = false;
	}

	/**
	 *	@private
	 */
	handlePaint() {
		if (this.active) {
			window.requestAnimationFrame(this.handlePaint);

			var unitInput = math.mapLinearClamp(Date.now(), this.startTime, this.stopTime, 0, 1);
			var value = math.mapLinearClamp(unitInput, 0.01, 0.99, this.valueFrom, this.valueTo);

			if (this.easing == Transition.Easing.Ease) {
				var unitValue = (unitInput ** 2) * (-2 * unitInput + 3);
				value = math.mapLinearClamp(unitValue, 0.01, 0.99, this.valueFrom, this.valueTo);
			}

			if (math.fuzzyEquals(value, this.valueTo)) {
				this.stop();
			}

			this.emit('paint', value);

			if (!this.active) {
				this.emit('end');
			}
		}
	}

};

Transition.Easing = {};
Transition.Easing.Linear = 'Linear';
Transition.Easing.Ease = 'Ease';

Emitter(Transition.prototype);

var instances = {};

module.exports = {

	/**
	 *	Start a transition between specified numeric values.
	 *
	 *	@param {string} id
	 *	@param {number} valueFrom
	 *	@param {number} valueTo
	 *	@param {number} duration - Transition duration in ms
	 *	@param {Transition.Easing=} easing
	 */
	start( id, valueFrom, valueTo, duration, easing ) {
		if (instances[id]) {
			instances[id].stop();
		}

		instances[id] = new Transition(valueFrom, valueTo, duration, easing);

		return instances[id];
	},

	/**
	 *	Stop the specified transition.
	 *
	 *	@param {string} id
	 */
	stop( id ) {
		if (instances[id]) {
			instances[id].stop();
			delete instances[id];
		}
	},

	Easing: Transition.Easing

};