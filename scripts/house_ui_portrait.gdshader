shader_type canvas_item;
void fragment() {
 vec2 p = UV - vec2(0.5);
 float edge = 1.0 - smoothstep(0.485, 0.5, length(p));
 float bottom = 1.0 - smoothstep(0.81, 0.83, UV.y);
 COLOR = texture(TEXTURE, UV);
 COLOR.a *= edge * bottom;
}
