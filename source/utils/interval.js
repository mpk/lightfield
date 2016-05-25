/**
 *	Immutable closed interval
 */
var math = require('math');

class Interval {

	/**
	 *	@param {number} min
	 *	@param {number} max
	 */
	constructor( min, max ) {
		this.min = min;
		this.max = max;
	}

	/**
	 *	Create instance from plain object.
	 *
	 *	@param {{ min: number, max: number }} object
	 *	@return {Interval}
	 */
	static fromObject( object ) {
		return new Interval(object.min, object.max);
	}

	/**
	 *	Clamp the specified value to this interval.
	 *
	 *	@param {number} value
	 *	@return {number}
	 */
	clamp( value ) {
		return math.clamp(value, this.min, this.max);
	}

	/**
	 *	Retrieve value at normalized offset from min endpoint.
	 *
	 *	@param {number} offset
	 *	@return {number}
	 */
	getValueAt( offset ) {
		return math.mapLinearClamp(offset, 0, 1, this.min, this.max);
	}

};

module.exports = Interval;