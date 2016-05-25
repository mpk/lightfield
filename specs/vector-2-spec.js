var Size = require('../source/utils/size');
var Vector2 = require('../source/utils/vector-2');

describe('Vector2', function() {

	describe('constructor', function() {

		it('creates zero vector', function() {
			var vector = new Vector2();

			expect(vector.x).toBe(0);
			expect(vector.y).toBe(0);
		});

		it('creates vector', function() {
			var vector = new Vector2(-5, 9);

			expect(vector.x).toBe(-5);
			expect(vector.y).toBe(9);
		});

	});

	describe('fromObject()', function() {

		it('creates vector2', function() {
			var vector = Vector2.fromObject({ x: -5, y: 9 });

			expect(vector.x).toBe(-5);
			expect(vector.y).toBe(9);
		});

	});

	describe('fromSize()', function() {

		it('creates vector2', function() {
			var vector = Vector2.fromSize(new Size(848, 480));

			expect(vector.x).toBe(848);
			expect(vector.y).toBe(480);
		});

	});

	describe('.divideScalar()', function() {

		it('divides vector by scalar', function() {
			var vector = new Vector2(8, 12);
			var result = vector.divideScalar(4);

			expect(result.x).toBe(2);
			expect(result.y).toBe(3);
			expect(result).not.toBe(vector);
		});

	});

	describe('.floor()', function() {

		it('rounds down both components', function() {
			var vector = new Vector2(5.8, -3.4);
			var result = vector.floor();

			expect(result.x).toBe(5);
			expect(result.y).toBe(-4);
			expect(result).not.toBe(vector);
		});

	});

	describe('.ceil()', function() {

		it('rounds up both components', function() {
			var vector = new Vector2(5.8, 3.4);
			var result = vector.ceil();

			expect(result.x).toBe(6);
			expect(result.y).toBe(4);
			expect(result).not.toBe(vector);
		});

	});

	describe('.multiplySize()', function() {

		it('multiplies vector by size', function() {
			var vector = new Vector2(3, 5);
			var size = new Size(10, 20);
			var result = vector.multiplySize(size);

			expect(result.x).toBe(30);
			expect(result.y).toBe(100);
			expect(result).not.toBe(vector);
		});

	});

	describe('.getSquaredDistanceTo()', function() {

		it('calculates squared distance', function() {
			var vector1 = new Vector2(3, 5);
			var vector2 = new Vector2(6, 9);

			expect(vector1.getSquaredDistanceTo(vector2)).toBe(25);
		});

	});

});