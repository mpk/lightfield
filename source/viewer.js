/**
 *	Lightfield viewer (public API)
 */
var React = require('react');
var ReactDOM = require('react-dom');
var reactRedux = require('react-redux');
var redux = require('redux');
var reduxThunk = require('redux-thunk');
var actions = require('./actions');
var constants = require('./constants');
var Container = require('./components/container');
var rootReducer = require('./reducers/root');
var Size = require('./utils/size');

class Viewer {

	/**
	 *	@param {HTMLElement} domElement
	 *	@param {object} options
	 *	@param {number} options.width
	 *	@param {number} options.height
	 */
	constructor( domElement, options = {} ) {
		var createStore = redux.applyMiddleware(reduxThunk)(redux.createStore);
		this.store = createStore(rootReducer);

		this.setSize(options.width || constants.DefaultSize.width, options.height || constants.DefaultSize.height);

		ReactDOM.render(
			<reactRedux.Provider store={this.store}>
				<Container />
			</reactRedux.Provider>,
			domElement
		);
	}

	/**
	 *	Load lightfield from the specified path (folder).
	 *
	 *	@param {string} path
	 */
	load( path ) {
		if (!this.store.getState().rendererError) {
			this.store.dispatch(actions.loadFile(path));
		}
	}

	/**
	 *	Resize the viewer.
	 *
	 *	@param {number} width
	 *	@param {number} height
	 */
	setSize( width, height ) {
		// Enforce minimum size
		width = Math.max(width, constants.MinSize.width);
		height = Math.max(height, constants.MinSize.height);

		this.store.dispatch(actions.setSize(width, height));
	}

};



module.exports = Viewer;