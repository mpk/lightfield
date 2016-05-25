/**
 *	Additional Jasmine matchers
 */
module.exports = {

	toContainSameItems() {
		return {
			compare( actual, expected ) {
				var result = {};

				result.pass = actual.length === expected.length
					&& expected.every(( item ) => actual.indexOf(item) != -1);

				return result;
			}
		};
	}

};