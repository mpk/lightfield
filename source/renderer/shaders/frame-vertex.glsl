precision mediump float;

attribute vec2 position;
attribute vec2 offset;

varying vec2 frame_offset;
varying vec2 uv;

varying vec4 e11;
varying vec4 e12;
varying vec4 e21;
varying vec4 e22;

uniform sampler2D page_table;

uniform float focus;
uniform vec2 resolution;
uniform vec2 frame_size;
uniform vec2 page_table_size;
uniform vec2 viewpoint_max;
uniform vec2 viewpoint;

vec4 get_entry( vec2 image_pos ) {
	return texture2D(page_table, vec2(image_pos.x + viewpoint_max.x + 0.5, page_table_size.y - (image_pos.y + viewpoint_max.y + 0.5)) / page_table_size);
}

void main() {
	frame_offset = offset;

	vec2 viewpoint_floor = floor(viewpoint);

	e11 = get_entry(viewpoint_floor + offset);
	e12 = get_entry(viewpoint_floor + offset + vec2(0.0, 1.0));
	e21 = get_entry(viewpoint_floor + offset + vec2(1.0, 0.0));
	e22 = get_entry(viewpoint_floor + offset + vec2(1.0, 1.0));

	uv = (position + vec2(1.0)) / vec2(2.0);

	gl_Position = vec4(position + (vec2(-offset.x, offset.y) * focus * (resolution / frame_size)) / (resolution / 2.0), 0.0, 1.0);
}