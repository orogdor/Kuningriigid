shader_type canvas_item;
void fragment() {
 vec2 p = UV - vec2(0.5);
 float edge = 1.0 - smoothstep(0.485, 0.5, length(p));
 COLOR = texture(TEXTURE, UV);
 COLOR.a *= edge;
}
