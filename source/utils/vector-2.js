/**
 *	Immutable 2D vector
 */
class Vector2 {

	/**
	 *	@param {number=} x
	 *	@param {number=} y
	 */
	constructor( x = 0, y = 0 ) {
		this.x = x;
		this.y = y;
	}

	/**
	 *	Create instance from plain object.
	 *
	 *	@param {{ x: number, y: number }} object
	 *	@return {Vector2}
	 */
	static fromObject( object ) {
		return new Vector2(object.x, object.y);
	}

	/**
	 *	Create instance from Size instance (width as x, height as y).
	 *
	 *	@param {Size} size
	 *	@return {Vector2}
	 */
	static fromSize( size ) {
		return new Vector2(size.width, size.height);
	}

	/**
	 *	Divide vector by scalar.
	 *
	 *	@param {number} scalar
	 *	@return {Vector2}
	 */
	divideScalar( scalar ) {
		return new Vector2(
			this.x / scalar,
			this.y / scalar
		);
	}

	/**
	 *	Round down both components of this vector.
	 *
	 *	@return {Vector2}
	 */
	floor() {
		return new Vector2(
			Math.floor(this.x),
			Math.floor(this.y)
		);
	}

	/**
	 *	Round up both components of this vector.
	 *
	 *	@return {Vector2}
	 */
	ceil() {
		return new Vector2(
			Math.ceil(this.x),
			Math.ceil(this.y)
		);
	}

	/**
	 *	Multiply this vector by a Size instance.
	 *
	 *	@param {Size} size
	 *	@return {Vector2}
	 */
	multiplySize( size ) {
		return new Vector2(
			this.x * size.width,
			this.y * size.height
		);
	}

	/**
	 *	Calculate squared Euclidean distance to the specified vector.
	 *
	 *	@param {Vector2} vector
	 *	@return {number}
	 */
	getSquaredDistanceTo( vector ) {
		return (this.x - vector.x) ** 2 + (this.y - vector.y) ** 2;
	}

};

module.exports = Vector2;