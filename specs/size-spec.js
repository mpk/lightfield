var Size = require('../source/utils/size');

describe('Size', function() {

	describe('constructor', function() {

		it('creates size', function() {
			var size = new Size(8, 15);

			expect(size.width).toBe(8);
			expect(size.height).toBe(15);
		});

	});

	describe('fromObject()', function() {

		it('creates size', function() {
			var size = Size.fromObject({ width: 8, height: 15 });

			expect(size.width).toBe(8);
			expect(size.height).toBe(15);
		});

	});

	describe('min()', function() {

		it('creates min size', function() {
			var size1 = new Size(848, 480);
			var size2 = new Size(512, 720);
			var result = Size.min(size1, size2);

			expect(result.width).toBe(512);
			expect(result.height).toBe(480);
		});

	});

	describe('.divide()', function() {

		it('divides size by another size', function() {
			var size1 = new Size(840, 480);
			var size2 = new Size(210, 40);
			var result = size1.divide(size2);

			expect(result.width).toBe(4);
			expect(result.height).toBe(12);
			expect(result).not.toBe(size1);
		});

	});

	describe('.divideScalar()', function() {

		it('divides size by scalar', function() {
			var size = new Size(840, 480);
			var result = size.divideScalar(4);

			expect(result.width).toBe(210);
			expect(result.height).toBe(120);
			expect(result).not.toBe(size);
		});

	});

	describe('.fit()', function() {

		it('scales down passed size', function() {
			var size1 = new Size(840, 480);
			var size2 = new Size(1260, 360);
			var result = size1.fit(size2);

			expect(result.width).toBe(840);
			expect(result.height).toBe(240);
			expect(result).not.toBe(size1);
		});

		it('scales up passed size', function() {
			var size1 = new Size(840, 480);
			var size2 = new Size(200, 320);
			var result = size1.fit(size2);

			expect(result.width).toBe(300);
			expect(result.height).toBe(480);
		});

	});

	describe('.toNextPowerOfTwo()', function() {

		it('scales dimensions to next power of two', function() {
			var size = new Size(840, 480);
			var result = size.toNextPowerOfTwo();

			expect(result.width).toBe(1024);
			expect(result.height).toBe(512);
			expect(result).not.toBe(size);
		});

	});

});