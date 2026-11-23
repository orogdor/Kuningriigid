shader_type spatial;
render_mode cull_disabled;

void fragment() {
    float x = (UV.x - 0.5) * 150.0;
    float z = UV.y * 50.0;
    float ripple = sin(z * 25.0 + sin(x * 2.05) * 1.8 + sin(x * 0.47) * 0.71);
    ripple *= 1.0 - smoothstep(0.5, 2.0, fwidth(z * 25.0));
    float swash = cos(38.0 * z + sin(x * 5.1) * 0.36);
    float edge = 1.0 - smoothstep(0.10, 0.41, z);
    ALBEDO = mix(vec3(0.075, 0.23, 0.24) + vec3(0.018 * ripple), vec3(0.24, 0.35, 0.27) + vec3(0.048 * swash), edge);
    ROUGHNESS = 0.36;
    METALLIC = 0.05;
}
