var Interval = require('../source/utils/interval');

describe('Interval', function() {

	describe('constructor', function() {

		it('creates interval', function() {
			var interval = new Interval(-8, 2);

			expect(interval.min).toBe(-8);
			expect(interval.max).toBe(2);
		});

	});

	describe('fromObject()', function() {

		it('creates interval', function() {
			var interval = Interval.fromObject({ min: -8, max: 2 });

			expect(interval.min).toBe(-8);
			expect(interval.max).toBe(2);
		});

	});

	describe('.clamp()', function() {

		it('returns min value if below bounds', function() {
			var interval = new Interval(-8, 2);
			var result = interval.clamp(-9);

			expect(result).toBe(-8);
		});

		it('returns max value if above bounds', function() {
			var interval = new Interval(-8, 2);
			var result = interval.clamp(5);

			expect(result).toBe(2);
		});

		it('returns same value if inside bounds', function() {
			var interval = new Interval(-8, 2);
			var result = interval.clamp(-1);

			expect(result).toBe(-1);
		});

	});

	describe('.getValueAt()', function() {

		it('returns endpoint', function() {
			var interval = new Interval(-8, 2);
			var result = interval.getValueAt(0);

			expect(result).toBe(-8);
		});

		it('returns endpoint', function() {
			var interval = new Interval(-8, 2);
			var result = interval.getValueAt(1);

			expect(result).toBe(2);
		});

		it('returns interpolated value', function() {
			var interval = new Interval(-8, 2);
			var result = interval.getValueAt(0.2);

			expect(result).toBe(-6);
		});

	});

});