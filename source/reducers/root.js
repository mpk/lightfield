/**
 *	Root reducer
 */
var math = require('math');
var reduxActions = require('redux-actions');
var Size = require('../utils/size');
var Vector2 = require('../utils/vector-2');

module.exports = reduxActions.handleActions({

	LoadFileRequest( state ) {
		return { ...state, file: null, loadProgress: 0, fileError: null, helpVisible: false };
	},

	LoadFileProgress( state, action ) {
		return { ...state, loadProgress: action.payload };
	},

	LoadFileSuccess( state, action ) {
		var file = action.payload;

		return { ...state, loadProgress: null, file, aperture: InitAperture, focus: file.focusInterval.getValueAt(0.25), viewpoint: new Vector2() };
	},

	LoadFileError( state ) {
		return { ...state, loadProgress: null, fileError: true };
	},

	SetAperture( state, action ) {
		var aperture = math.clamp(action.payload, 0, state.maxAperture);
		var viewpoint = adjustViewpoint(state.file, state.viewpoint, aperture);

		return { ...state, aperture, viewpoint, helpVisible: false };
	},

	SetFocus( state, action ) {
		return { ...state, focus: state.file.focusInterval.clamp(action.payload), helpVisible: false };
	},

	SetViewpoint( state, action ) {
		var viewpoint = adjustViewpoint(state.file, action.payload, state.aperture);

		return { ...state, viewpoint, helpVisible: false };
	},

	FocusAt( state, action ) {
		return { ...state, focusPosition: action.payload, helpVisible: false };
	},

	SetSize( state, action ) {
		return { ...state, size: action.payload };
	},

	SetFullscreen( state, action ) {
		return { ...state, fullscreen: action.payload };
	},

	ToggleHelp( state, action ) {
		return { ...state, helpVisible: !state.helpVisible };
	},

	SetMaxAperture( state, action ) {
		return { ...state, maxAperture: action.payload, aperture: math.clamp(state.aperture, 0, action.payload) };
	},

	ReportRendererError( state, action ) {
		return { ...state, rendererError: action.payload };
	}

}, {
	file: null,
	loadProgress: null,
	fileError: null,
	size: new Size(),
	aperture: 0,
	focus: 0,
	viewpoint: new Vector2(),
	maxAperture: 4,
	focusPosition: new Vector2(),
	rendererError: null,
	helpVisible: false,
	fullscreen: false
});

const InitAperture = 2;

function adjustViewpoint( file, viewpoint, aperture ) {
	return new Vector2(
		math.clamp(viewpoint.x, -file.maxViewpoint.x + aperture, file.maxViewpoint.x - aperture),
		math.clamp(viewpoint.y, -file.maxViewpoint.y + aperture, file.maxViewpoint.y - aperture)
	);
}