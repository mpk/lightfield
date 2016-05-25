/**
 *	Immutable 2D size
 */
class Size {

	/**
	 *	@param {number} width
	 *	@param {number} height
	 */
	constructor( width, height ) {
		this.width = width;
		this.height = height;
	}

	/**
	 *	Create instance from plain object.
	 *
	 *	@param {{ width: number, height: number }} object
	 *	@return {Size}
	 */
	static fromObject( object ) {
		return new Size(object.width, object.height);
	}

	/**
	 *	Create new size that fits in both passed sizes.
	 *
	 *	@param {Size} size1
	 *	@param {Size} size2
	 *	@return {Size}
	 */
	static min( size1, size2 ) {
		return new Size(
			Math.min(size1.width, size2.width),
			Math.min(size1.height, size2.height)
		)
	}

	/**
	 *	Divide size by another size.
	 *
	 *	@param {Size} size
	 *	@return {Size}
	 */
	divide( size ) {
		return new Size(
			this.width / size.width,
			this.height / size.height
		);
	}

	/**
	 *	Divide size by scalar.
	 *
	 *	@param {number} scalar
	 *	@return {Size}
	 */
	divideScalar( scalar ) {
		return new Size(
			this.width / scalar,
			this.height / scalar
		);
	}

	/**
	 *	Scale the given size to fit inside this size while preserving its aspect ratio.
	 *
	 *	@param {Size} size
	 *	@return {Size}
	 */
	fit( size ) {
		var aspectRatio = Math.min(this.width / size.width, this.height / size.height);

		return new Size(size.width * aspectRatio, size.height * aspectRatio);
	}

	/**
	 *	Scale the dimensions to next power of two.
	 *
	 *	@return {Size}
	 */
	toNextPowerOfTwo() {
		return new Size(
			2 ** Math.ceil(Math.log2(this.width)),
			2 ** Math.ceil(Math.log2(this.height))
		);
	}

};

module.exports = Size;