/**
 * Shader Management System for Genshi Studio
 */

import { Shader } from '../../types/graphics';

export class ShaderManager {
  private gl: WebGL2RenderingContext;
  private shaders: Map<string, Shader> = new Map();
  private currentShader: Shader | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.initializeDefaultShaders();
  }

  private initializeDefaultShaders(): void {
    // Basic 2D rendering shader
    this.createShader('basic2d', {
      vertex: `#version 300 es
        precision highp float;
        
        in vec2 a_position;
        in vec2 a_texCoord;
        in vec4 a_color;
        
        uniform mat3 u_matrix;
        uniform vec2 u_resolution;
        
        out vec2 v_texCoord;
        out vec4 v_color;
        
        void main() {
          vec3 position = u_matrix * vec3(a_position, 1.0);
          vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          
          v_texCoord = a_texCoord;
          v_color = a_color;
        }
      `,
      fragment: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        in vec4 v_color;
        
        uniform sampler2D u_texture;
        uniform float u_useTexture;
        
        out vec4 fragColor;
        
        void main() {
          vec4 texColor = texture(u_texture, v_texCoord);
          fragColor = mix(v_color, texColor * v_color, u_useTexture);
          
          // Premultiply alpha
          fragColor.rgb *= fragColor.a;
        }
      `
    });

    // Brush rendering shader with pressure sensitivity
    this.createShader('brush', {
      vertex: `#version 300 es
        precision highp float;
        
        in vec2 a_position;
        in vec2 a_texCoord;
        in float a_pressure;
        
        uniform mat3 u_matrix;
        uniform vec2 u_resolution;
        uniform float u_brushSize;
        
        out vec2 v_texCoord;
        out float v_pressure;
        
        void main() {
          vec3 position = u_matrix * vec3(a_position, 1.0);
          vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          
          v_texCoord = a_texCoord;
          v_pressure = a_pressure;
        }
      `,
      fragment: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        in float v_pressure;
        
        uniform vec4 u_color;
        uniform float u_hardness;
        uniform float u_opacity;
        uniform sampler2D u_brushTexture;
        
        out vec4 fragColor;
        
        void main() {
          float dist = length(v_texCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Apply hardness
          alpha = pow(alpha, 1.0 / max(u_hardness, 0.01));
          
          // Apply pressure
          alpha *= v_pressure;
          
          // Apply global opacity
          alpha *= u_opacity;
          
          fragColor = vec4(u_color.rgb * alpha, alpha);
        }
      `
    });

    // Pattern rendering shader
    this.createShader('pattern', {
      vertex: `#version 300 es
        precision highp float;
        
        in vec2 a_position;
        uniform mat3 u_matrix;
        uniform vec2 u_resolution;
        
        out vec2 v_position;
        
        void main() {
          vec3 position = u_matrix * vec3(a_position, 1.0);
          vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          
          v_position = a_position;
        }
      `,
      fragment: `#version 300 es
        precision highp float;
        
        in vec2 v_position;
        
        uniform vec4 u_color1;
        uniform vec4 u_color2;
        uniform float u_scale;
        uniform float u_rotation;
        uniform int u_patternType;
        
        out vec4 fragColor;
        
        mat2 rotate2d(float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return mat2(c, -s, s, c);
        }
        
        void main() {
          vec2 pos = rotate2d(u_rotation) * v_position / u_scale;
          
          float pattern = 0.0;
          
          if (u_patternType == 0) { // Ichimatsu (checkerboard)
            pattern = mod(floor(pos.x) + floor(pos.y), 2.0);
          } else if (u_patternType == 1) { // Seigaiha (waves)
            float wave = sin(pos.x * 3.14159) * cos(pos.y * 3.14159);
            pattern = step(0.0, wave);
          } else if (u_patternType == 2) { // Asanoha (hemp leaf)
            vec2 grid = fract(pos * 0.5) - 0.5;
            float star = max(abs(grid.x), abs(grid.y));
            pattern = step(0.3, star);
          }
          
          fragColor = mix(u_color1, u_color2, pattern);
          fragColor.rgb *= fragColor.a;
        }
      `
    });
  }

  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }

    return shader;
  }

  createShader(name: string, sources: { vertex: string; fragment: string }): Shader {
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, sources.vertex);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, sources.fragment);

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Failed to create shader program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Shader linking failed: ${info}`);
    }

    // Clean up shader objects
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    // Get all uniforms
    const uniforms = new Map<string, WebGLUniformLocation>();
    const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const info = this.gl.getActiveUniform(program, i);
      if (info) {
        const location = this.gl.getUniformLocation(program, info.name);
        if (location) {
          uniforms.set(info.name, location);
        }
      }
    }

    // Get all attributes
    const attributes = new Map<string, number>();
    const attributeCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeCount; i++) {
      const info = this.gl.getActiveAttrib(program, i);
      if (info) {
        const location = this.gl.getAttribLocation(program, info.name);
        if (location >= 0) {
          attributes.set(info.name, location);
        }
      }
    }

    const shader: Shader = { program, uniforms, attributes };
    this.shaders.set(name, shader);
    return shader;
  }

  useShader(name: string): Shader | null {
    const shader = this.shaders.get(name);
    if (!shader) {
      console.error(`Shader '${name}' not found`);
      return null;
    }

    this.gl.useProgram(shader.program);
    this.currentShader = shader;
    return shader;
  }

  getCurrentShader(): Shader | null {
    return this.currentShader;
  }

  setUniform(name: string, value: any): void {
    if (!this.currentShader) return;

    const location = this.currentShader.uniforms.get(name);
    if (!location) return;

    if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (value instanceof Float32Array) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value);
          break;
        case 3:
          this.gl.uniform3fv(location, value);
          break;
        case 4:
          this.gl.uniform4fv(location, value);
          break;
        case 9:
          this.gl.uniformMatrix3fv(location, false, value);
          break;
        case 16:
          this.gl.uniformMatrix4fv(location, false, value);
          break;
      }
    } else if (typeof value === 'boolean' || Number.isInteger(value)) {
      this.gl.uniform1i(location, value ? 1 : 0);
    }
  }

  destroy(): void {
    for (const shader of this.shaders.values()) {
      this.gl.deleteProgram(shader.program);
    }
    this.shaders.clear();
    this.currentShader = null;
  }
}