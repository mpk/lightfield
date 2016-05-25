/**
 *	Action creators
 */
var reduxActions = require('redux-actions');
var FileLoader = require('./utils/file-loader');
var Size = require('./utils/size');
var Transition = require('./utils/transition');
var Vector2 = require('./utils/vector-2');

var actions = {

	loadFile( path ) {
		return ( dispatch ) => {
			Transition.stop('Focus');

			dispatch(reduxActions.createAction('LoadFileRequest')());

			FileLoader.get(path)
				.on('progress', ( value ) => dispatch(reduxActions.createAction('LoadFileProgress')(value)))
				.on('complete', ( file ) => dispatch(reduxActions.createAction('LoadFileSuccess')(file)))
				.on('error', () => dispatch(reduxActions.createAction('LoadFileError')()));
		};
	},

	setAperture: reduxActions.createAction('SetAperture'),

	setFocus: reduxActions.createAction('SetFocus', ( value, retainTransition ) => {
		if (!retainTransition) Transition.stop('Focus');
		return value;
	}),

	setViewpoint: reduxActions.createAction('SetViewpoint', ( positionX, positionY ) => new Vector2(positionX, positionY)),

	focusAt( offsetX, offsetY ) {
		return ( dispatch, getState ) => {
			dispatch(reduxActions.createAction('FocusAt', () => new Vector2(offsetX, offsetY))());

			Transition.start('Focus', getState().focus, getState().file.getFocusAt(new Vector2(offsetX, offsetY)), 750, Transition.Easing.Ease)
				.on('paint', ( value ) => dispatch(actions.setFocus(value, true)));
		};
	},

	setSize: reduxActions.createAction('SetSize', ( width, height ) => new Size(width, height)),

	setFullscreen: reduxActions.createAction('SetFullscreen'),

	toggleHelp: reduxActions.createAction('ToggleHelp'),

	setMaxAperture: reduxActions.createAction('SetMaxAperture'),

	reportRendererError: reduxActions.createAction('ReportRendererError')

};

module.exports = actions;