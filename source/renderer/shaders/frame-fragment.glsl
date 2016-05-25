precision mediump float;

#define I_TEXTURE_SIZE VALUE
#define P_TEXTURE_SIZE VALUE
#define P_BLOCK_SIZE VALUE
#define P_BLOCK_PRECISION VALUE

varying vec2 frame_offset;
varying vec2 uv;

varying vec4 e11;
varying vec4 e12;
varying vec4 e21;
varying vec4 e22;

uniform sampler2D i_frames;
uniform sampler2D p_frames;
uniform sampler2D page_table;

uniform vec2 frame_size;
uniform vec2 page_table_size;
uniform vec2 viewpoint_max;
uniform vec2 viewpoint;
uniform float frame_count;

// WebGL does not have round() function built-in
float _round( float x ) {
	return sign(x) * floor(abs(x) + 0.5);
}

vec4 get_entry( vec2 image_pos ) {
	return texture2D(page_table, vec2(image_pos.x + viewpoint_max.x + 0.5, page_table_size.y - (image_pos.y + viewpoint_max.y + 0.5)) / page_table_size);
}

vec4 get_color_intra( vec4 entry, vec2 offset ) {
	vec2 frame_coord = uv * frame_size + offset;
	vec2 frame_offset = entry.xy * frame_size * 255.0;

	return texture2D(i_frames, (frame_coord + frame_offset) / I_TEXTURE_SIZE);
}

vec4 get_color_predicted( vec4 entry, vec2 image_pos ) {
	vec2 frame_coord = uv * frame_size;
	vec2 frame_offset = entry.xy * frame_size * 255.0;

	vec4 pointer = texture2D(p_frames, ((frame_coord + frame_offset) / vec2(P_BLOCK_SIZE)) / P_TEXTURE_SIZE);

	image_pos.x += mod(_round(pointer.x * 255.0), 3.0) - 1.0;
	image_pos.y += floor(_round(pointer.x * 255.0) / 3.0) - 1.0;

	vec2 offset = vec2((pointer.y * 255.0 - 128.0) / P_BLOCK_PRECISION, -((pointer.z * 255.0 - 128.0) / P_BLOCK_PRECISION));
	vec4 color_output = get_color_intra(get_entry(image_pos), offset);

	return color_output;
}

vec4 get_color( vec4 entry, vec2 image_pos ) {
	vec4 color_output = vec4(0.0);

	if (entry.z == 1.0) {
		color_output = get_color_predicted(entry, image_pos);
	} else {
		color_output = get_color_intra(entry, vec2(0.0));
	}

	return color_output;
}

void main() {
	vec2 viewpoint_floor = floor(viewpoint);

	vec4 c11 = get_color(e11, viewpoint_floor + frame_offset);
	vec4 c12 = get_color(e12, viewpoint_floor + frame_offset + vec2(0.0, 1.0));
	vec4 c21 = get_color(e21, viewpoint_floor + frame_offset + vec2(1.0, 0.0));
	vec4 c22 = get_color(e22, viewpoint_floor + frame_offset + vec2(1.0, 1.0));

	vec4 r1 = mix(c11, c12, fract(viewpoint.y));
	vec4 r2 = mix(c21, c22, fract(viewpoint.y));

	gl_FragColor = mix(r1, r2, fract(viewpoint.x)) / frame_count;
}