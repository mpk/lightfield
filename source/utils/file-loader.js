/**
 *	Loader for lightfield resources
 */
var Emitter = require('component-emitter');
var File = require('../models/file');

class FileLoader {

	/**
	 *	@param {string} path - Path to lightfield folder
	 */
	constructor( path ) {
		this.aborted = false;

		this.loadedResources = 0;
		this.totalResources = 0;

		this.loadJSON(`${path}/manifest.json`).then(( manifest ) => {
			if (this.aborted) return;

			var frameCount = manifest.matrix.width * manifest.matrix.height;
			this.totalResources = frameCount + 2; // 2 = manifest + depth map
			this.handleResourceLoad();

			// Load resources (depth map + frames)
			var resources = [this.loadImage(`${path}/depth.png`)];
			for (let i = 0; i < frameCount; i += 1) {
				resources.push(this.loadImage(`${path}/${i}.lfi`));
			}

			// Track progress of individual resources
			resources = resources.map(( resource ) => resource.then(this.handleResourceLoad.bind(this)));

			return Promise.all(resources).then(( [ depthMap, ...frames ] ) => {
				var file = new File(manifest, frames, depthMap);
				this.tryEmit('complete', file);
			});
		}).catch(( error ) => {
			console.error(error);
			this.tryEmit('error');
			this.abort();
		});
	}

	/**
	 *	Abort request for the file.
	 */
	abort() {
		this.aborted = true;
	}

	/**
	 *	Emit the event only if the request has not been aborted.
	 *
	 *	@private
	 *	@param {string} name
	 *	@param {...*} values
	 */
	tryEmit( event, ...values ) {
		if (!this.aborted) {
			this.emit(event, ...values);
		}
	}

	/**
	 *	@private
	 *	@param {*} resource
	 *	@return {*}
	 */
	handleResourceLoad( resource ) {
		this.loadedResources += 1;
		this.tryEmit('progress', this.loadedResources / this.totalResources);

		return resource;
	}

	/**
	 *	@private
	 *	@param {string} path
	 *	@return {Promise}
	 */
	loadJSON( path ) {
		return new Promise(( resolve, reject ) => {
			var resource = new XMLHttpRequest();

			resource.addEventListener('loadend', () => {
				if (resource.status == 200) {
					var responseData;

					try {
						responseData = JSON.parse(resource.responseText);
					} catch ( ex ) {}

					if (responseData) {
						resolve(responseData);
					} else {
						reject(`Cannot parse JSON: ${path}`);
					}
				} else {
					reject(`Cannot load resource: ${path}`);
				}
			});

			resource.open('GET', path, true);
			resource.send(null);
		});
	}

	/**
	 *	@private
	 *	@param {string} path
	 *	@return {Promise}
	 */
	loadImage( path ) {
		return new Promise(( resolve, reject ) => {
			var resource = new Image();

			resource.addEventListener('load', () => {
				resolve(resource);
			});

			resource.addEventListener('error', () => {
				reject(`Cannot load resource: ${path}`);
			});

			resource.src = path;
		});
	}

};

Emitter(FileLoader.prototype);

var activeInstance = null;

module.exports = {

	/**
	 *	Load lightfield from the specified path and abort previous request.
	 *
	 *	@param {string} path - Path to lightfield folder
	 *	@return {FileLoader}
	 */
	get( path ) {
		if (activeInstance) {
			activeInstance.abort();
		}

		activeInstance = new FileLoader(path);

		return activeInstance;
	}

};