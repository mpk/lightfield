precision mediump float;

attribute vec2 position;

varying vec2 uv;

uniform vec2 output_size;
uniform float max_frame_size;

void main() {
	uv = (position.xy + vec2(1.0)) / vec2(2.0);
	uv *= output_size / vec2(max_frame_size);

	gl_Position = vec4(position.xy, 0.0, 1.0);
}