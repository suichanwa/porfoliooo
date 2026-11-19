import { Color, ShaderMaterial } from "three";

const EARTH_CLOUDS_VERTEX_SHADER = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vObjPos = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_CLOUDS_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCloudColor;
  varying vec3 vObjPos;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
                   mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                   mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    mat3 rot = mat3(
       0.00,  0.80,  0.60,
      -0.80,  0.36, -0.48,
      -0.60, -0.48,  0.64
    );
    for (int i = 0; i < 4; ++i) {
      v += a * noise3(p);
      p = rot * p * 2.02 + vec3(1.2, 4.3, 2.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // 3D Cartesian spherical coordinates: completely seamless with zero polar pinching
    vec3 p = normalize(vObjPos) * 4.2;

    float cosT = cos(uTime * 0.03);
    float sinT = sin(uTime * 0.03);
    p.xz = mat2(cosT, -sinT, sinT, cosT) * p.xz;

    float n = fbm3(p);
    float cloudDensity = smoothstep(0.38, 0.70, n);

    // Sunlight calculation (Sun is at 0,0,0)
    vec3 sunDir = normalize(-vWorldPos);
    float sunDot = dot(vNormal, sunDir);
    float litCloud = smoothstep(-0.20, 0.35, sunDot);

    // Polar fade so Arctic & Antarctic ice caps remain crisp and clear
    float polarLat = abs(normalize(vObjPos).y);
    float polarFade = smoothstep(0.92, 0.72, polarLat);

    float twilight = exp(-pow((sunDot + 0.02) * 4.8, 2.0));
    vec3 cloudTint = mix(uCloudColor, vec3(1.0, 0.78, 0.56), twilight * 0.36);
    vec3 color = cloudTint * (litCloud * 0.95 + 0.05);
    gl_FragColor = vec4(color, cloudDensity * 0.38 * litCloud * polarFade);
  }
`;

export function createEarthCloudsMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCloudColor: { value: new Color("#ffffff") }
    },
    vertexShader: EARTH_CLOUDS_VERTEX_SHADER,
    fragmentShader: EARTH_CLOUDS_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false
  });
}
