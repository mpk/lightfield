var Frame = require('../source/models/frame');

describe('Frame', function() {

	beforeEach(function() {
		jasmine.addMatchers(require('./support/matchers'));
	});

	describe('constructor', function() {

		it('creates intra frame', function() {
			var frame0 = new Frame(0, null, { width: 17, height: 9 });

			expect(frame0.index).toBe(0);
			expect(frame0.position.x).toBe(-8);
			expect(frame0.position.y).toBe(-4);
			expect(frame0.type).toBe(Frame.Type.Intra);
			expect(frame0.sources).toContainSameItems([]);
		});

		it('creates predicted frame (horizontal)', function() {
			var frame1 = new Frame(1, null, { width: 17, height: 9 });

			expect(frame1.index).toBe(1);
			expect(frame1.position.x).toBe(-7);
			expect(frame1.position.y).toBe(-4);
			expect(frame1.type).toBe(Frame.Type.Predicted);
			expect(frame1.sources).toContainSameItems([0, 2]);
		});

		it('creates predicted frame (diagonal)', function() {
			var frame54 = new Frame(54, null, { width: 17, height: 9 });

			expect(frame54.index).toBe(54);
			expect(frame54.position.x).toBe(-5);
			expect(frame54.position.y).toBe(-1);
			expect(frame54.type).toBe(Frame.Type.Predicted);
			expect(frame54.sources).toContainSameItems([36, 38, 70, 72]);
		});

		it('creates predicted frame (vertical)', function() {
			var frame97 = new Frame(97, null, { width: 17, height: 9 });

			expect(frame97.index).toBe(97);
			expect(frame97.position.x).toBe(4);
			expect(frame97.position.y).toBe(1);
			expect(frame97.type).toBe(Frame.Type.Predicted);
			expect(frame97.sources).toContainSameItems([80, 114]);
		});

	});

});