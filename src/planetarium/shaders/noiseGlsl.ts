/**
 * Shared seamless 2D & 3D GLSL noise utilities used across solar, atmospheric,
 * and procedural planetary surface shaders.
 */
export const GLSL_NOISE_3D = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm2d(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; ++i) {
    value += amp * noise2d(p);
    p = rot * p * 2.05 + vec2(1.7, 3.1);
    amp *= 0.5;
  }
  return value;
}

float hash31(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return fract(sin(p) * 43758.5453123);
}

float noise3d(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm3d(vec3 p) {
  float value = 0.0;
  float amp = 0.5;
  mat3 rot = mat3(
     0.00,  0.80,  0.60,
    -0.80,  0.36, -0.48,
    -0.60, -0.48,  0.64
  );
  for (int i = 0; i < 3; ++i) {
    value += amp * noise3d(p);
    p = rot * p * 2.04 + vec3(1.7, 3.1, 2.3);
    amp *= 0.5;
  }
  return value;
}

/** Fast 8-tap nearest-octant 3D cellular distance for crater fields. */
vec2 voronoi3d(vec3 x) {
  vec3 base = floor(x - 0.5);
  vec3 f = x - base;
  float d1 = 8.0;
  float d2 = 8.0;
  for (int k = 0; k <= 1; k++) {
    for (int j = 0; j <= 1; j++) {
      for (int i = 0; i <= 1; i++) {
        vec3 g = vec3(float(i), float(j), float(k));
        vec3 o = hash33(base + g);
        vec3 r = g + (0.22 + 0.56 * o) - f;
        float d = dot(r, r);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) {
          d2 = d;
        }
      }
    }
  }
  return vec2(sqrt(d1), sqrt(d2));
}
`;
