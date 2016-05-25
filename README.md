# Light field WebGL viewer

Light field viewer (technology made famous by [Lytro cameras](https://www.lytro.com/imaging)), which allows users to synthesize images with custom aperture, focus and viewpoint from a single exposure.

![Screenshot](https://dl.dropboxusercontent.com/u/841468/external/lightfield-screenshot.png)

## Technology

### Light field compression

Light fields used by this viewer consists of images - views from many different directions (such as [these](http://lightfield.stanford.edu/lfs.html)).

- This format allows their efficient compression, because similarity between them can be exploited (as in video compression). Some of the images are encoded as "intra frames" (with JPEG compression) and the rest are encoded as "predicted frames" that are motion estimated only.
- It reduces bandwidth requirements 3-4x compared to plain JPEG compression of all images.

### GPU

The viewer exploits GPU acceleration (WebGL) to render light fields at interactive frame rates.

- It uses virtual texture technique to hold the light field views in the VRAM.
- Only necessary subset of views are stored in the virtual texture. However, if the virtual texture is not full and the user is not interacting with the viewer, views that might be necessary in the future are also uploaded there (in order to reduce number of views that have to be transferred between RAM and VRAM when the user is changing aperture or viewpoint).
- Motion estimated "predicted frames" are decoded at render time on GPU, which reduces both RAM and VRAM requirements (performance takes a hit though).
- Use of GPU allows to use bilinear interpolation to make changes between viewpoints smooth.

### Miscellaneous

The viewer uses ES6 syntax and its user interface is built with [React](http://facebook.github.io/react/) and [Redux](https://github.com/rackt/redux).


## Building

In order to run the bundled example, it is necessary to build the viewer files:

- Install [node.js](https://nodejs.org/).

- In the project root folder, create a folder named `build` and run:
```bash
npm install

npm run development # Development version
npm run release # Production (minified) version
```

### Tests

In the project root folder, run:
```bash
npm test
```
Open `localhost:9876` (Karma test runner) in a browser and see the results in the console.

## Encoder

The bundled encoder converts light fields that consists of views from different directions to the custom compressed format used by this viewer.

### Prerequisites

#### Windows
Install [node.js](https://nodejs.org/) and [go](https://golang.org/).

Download [jpegoptim](http://sourceforge.net/projects/jpegoptim/) and [pngcrush](http://sourceforge.net/projects/pmt/files/) and put the executables in PATH.

#### OS X (homebrew)
```bash
brew install node
brew install go
brew install jpegoptim
brew install pngcrush
```

### Running

In the project root folder, run:

```bash
npm install
```

In `/scripts` folder, run:

```bash
node encoder.js -i {input_folder} -o {output_folder} -w {images_x} -h {images_y} -q {jpeg_quality}
```
`input_folder` should contain images - views of the scene from different directions, which should form a grid as regular as possible. Number of images in X and Y axes are the `-w` and `-h` parameters (both must be odd numbers). The images must be named `0.png`, `1.png`, `2.png`, etc. and sorted in rows from top-left viewpoint to bottom-right one.

All images must have the same dimensions, divisible by 16.

`-q` parameter should be number between 0 and 100 (75 is recommended).

## License

MIT

Light fields are sourced from [Stanford University](http://lightfield.stanford.edu/index.html).