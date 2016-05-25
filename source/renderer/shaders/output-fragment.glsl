precision mediump float;

varying vec2 uv;

uniform sampler2D composite;

void main() {
	gl_FragColor = texture2D(composite, uv);
}