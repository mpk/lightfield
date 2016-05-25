/**
 *	Lightfield frame
 */
var Vector2 = require('../utils/vector-2');

class Frame {

	/**
	 *	@param {number} index
	 *	@param {HTMLImageElement} resource
	 *	@param {Size} matrixSize
	 */
	constructor( index, resource, matrixSize ) {
		this.index = index;
		this.resource = resource;

		// Position (top-left origin)
		var topLeftX = this.index % matrixSize.width;
		var topLeftY = Math.floor(this.index / matrixSize.width);

		// Position (center origin)
		this.position = new Vector2(
			topLeftX - Math.floor(matrixSize.width / 2),
			topLeftY - Math.floor(matrixSize.height / 2)
		);

		// Determine frame type and source frame indices for predicted frames
		if (topLeftX % 2 == 1 || topLeftY % 2 == 1) {
			this.type = Frame.Type.Predicted;

			if (topLeftX % 2 === 0) { // N / S
				this.sources = [
					this.index - matrixSize.width,
					this.index + matrixSize.width
				];
			} else if (topLeftY % 2 === 0) { // W / E
				this.sources = [
					this.index - 1,
					this.index + 1
				];
			} else {
				this.sources = [ // NW / NE / SW / SE
					this.index - matrixSize.width - 1,
					this.index - matrixSize.width + 1,
					this.index + matrixSize.width - 1,
					this.index + matrixSize.width + 1
				];
			}
		} else {
			this.type = Frame.Type.Intra;
			this.sources = [];
		}
	}

};

Frame.BlockSize = 16;
Frame.BlockPrecision = 4;

Frame.Type = {};
Frame.Type.Intra = 'Intra';
Frame.Type.Predicted = 'Predicted';

module.exports = Frame;