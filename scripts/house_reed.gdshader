shader_type spatial;
render_mode cull_disabled, diffuse_burley;

uniform sampler2D reed_atlas : source_color, filter_linear_mipmap, repeat_disable;
uniform vec4 reed_tint : source_color = vec4(0.46, 0.42, 0.36, 1.0);
varying vec3 surface_world;

void vertex() {
 surface_world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

vec2 reed_hash(vec2 p) {
 vec3 v = fract(p.xyx * vec3(0.1031, 0.1030, 0.0973));
 v += dot(v, v.yzx + vec3(33.33));
 return fract((v.xx + v.yz) * v.zy);
}

vec3 reed_sample(vec2 cell, vec2 uv) {
 vec2 random = reed_hash(cell);
 float variant = min(4.0, floor(random.x * 5.0));
 vec2 local_uv = fract(uv + random * 7.7);
 vec2 atlas_uv = (local_uv * 512.0 + vec2(8.0) + vec2(variant * 528.0, 0.0)) / vec2(2640.0, 528.0);
 return texture(reed_atlas, atlas_uv).rgb;
}

void fragment() {
 vec2 position = vec2(surface_world.x + 0.51 * surface_world.z + 0.32 * surface_world.y,
                      surface_world.z - 0.27 * surface_world.x + 0.81 * surface_world.y) * 0.94;
 vec2 cell = floor(position);
 vec2 blend = smoothstep(vec2(0.11), vec2(0.89), fract(position));
 vec3 color = reed_sample(cell, UV) * (1.0 - blend.x) * (1.0 - blend.y)
            + reed_sample(cell + vec2(1.0, 0.0), UV) * blend.x * (1.0 - blend.y)
            + reed_sample(cell + vec2(0.0, 1.0), UV) * (1.0 - blend.x) * blend.y
            + reed_sample(cell + vec2(1.0, 1.0), UV) * blend.x * blend.y;
 float wear = mix(0.79, 1.0, smoothstep(0.03, 0.60, surface_world.y));
 float mottling = sin(surface_world.x * 1.12 + sin(surface_world.z * 2.22))
                * sin(surface_world.y * 2.78 - surface_world.z * 1.29);
 ALBEDO = color * reed_tint.rgb * wear * (1.0 + 0.095 * mottling);
 ROUGHNESS = 0.96;
}
