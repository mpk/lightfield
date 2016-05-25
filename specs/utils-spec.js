var utils = require('../source/utils');

describe('utils', function() {

	describe('mapArray()', function() {

		it('creates mapped array', function() {
			var array = [10, 20, 30];
			var result = utils.mapArray(array, ( item ) => [item - 1, item + 1]);

			expect(array).toEqual([10, 20, 30]);
			expect(result).toEqual([9, 11, 19, 21, 29, 31]);
		});

	});

	describe('pushUnique()', function() {

		it('adds unique value', function() {
			var array = [1, 2];

			utils.pushUnique(array, 3);
			expect(array).toEqual([1, 2, 3]);
		});

		it('does not add already present value', function() {
			var array = [1, 2];

			utils.pushUnique(array, 2);
			expect(array).toEqual([1, 2]);
		});

	});

});