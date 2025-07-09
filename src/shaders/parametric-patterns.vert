#version 300 es

// Vertex shader for parametric pattern rendering
// Handles vertex transformations and passes data to fragment shader

in vec2 a_position;
in vec2 a_texCoord;

uniform mat3 u_transform;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scale;
uniform float u_rotation;
uniform vec2 u_offset;

out vec2 v_texCoord;
out vec2 v_position;
out vec2 v_screenPosition;

void main() {
  // Apply local transformations
  vec2 transformed = a_position;
  
  // Apply rotation
  float cos_r = cos(u_rotation);
  float sin_r = sin(u_rotation);
  mat2 rotation = mat2(cos_r, -sin_r, sin_r, cos_r);
  transformed = rotation * transformed;
  
  // Apply scale
  transformed *= u_scale;
  
  // Apply offset
  transformed += u_offset;
  
  // Apply global transformation matrix
  vec3 position = u_transform * vec3(transformed, 1.0);
  
  // Convert to normalized device coordinates
  vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
  
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  
  // Pass data to fragment shader
  v_texCoord = a_texCoord;
  v_position = transformed;
  v_screenPosition = position.xy;
}