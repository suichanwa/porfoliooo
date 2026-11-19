import { Color, ShaderMaterial } from "three";

const TITAN_HAZE_VERTEX_SHADER = /* glsl */ `
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

const TITAN_HAZE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uHazeColor;
  uniform vec3 uTerminatorColor;
  uniform vec3 uPolarColor;
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
    return mix(
      mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 sunDir = normalize(-vWorldPos);

    float ndotv = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - ndotv, 2.35);

    float sunDot = dot(N, sunDir);
    float dayFactor = smoothstep(-0.24, 0.38, sunDot);
    float terminatorGlow = exp(-pow((sunDot + 0.03) * 5.2, 2.0));

    // Subtle Cassini-style wind-sheared zonal haze bands and polar hood
    vec3 p = normalize(vObjPos);
    float n = noise3(p * vec3(3.2, 8.5, 3.2));
    float band = 0.84 + 0.16 * sin(p.y * 14.0 + n * 2.8);
    float polarHood = smoothstep(0.58, 0.94, abs(p.y));

    // Forward Mie scattering brightens backlit crescent limbs
    float forwardScatter = pow(max(dot(-V, sunDir), 0.0), 3.5) * fresnel * smoothstep(-0.65, 0.20, sunDot);

    vec3 hazeCol = mix(uHazeColor, uPolarColor, polarHood * 0.48);
    hazeCol = mix(hazeCol, uTerminatorColor, terminatorGlow * 0.52);
    hazeCol *= band;

    // Keep disk center subtle so hydrocarbon lakes & highlands remain crisp
    float diskHaze = 0.04 + 0.62 * fresnel;
    float alpha = diskHaze * (dayFactor * 0.94 + 0.03) + forwardScatter * 0.35;

    gl_FragColor = vec4(hazeCol, clamp(alpha, 0.0, 0.78));
  }
`;

export function createTitanHazeMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uHazeColor: { value: new Color("#e8a848") },
      uTerminatorColor: { value: new Color("#cf5d24") },
      uPolarColor: { value: new Color("#8a7e82") }
    },
    vertexShader: TITAN_HAZE_VERTEX_SHADER,
    fragmentShader: TITAN_HAZE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false
  });
}
