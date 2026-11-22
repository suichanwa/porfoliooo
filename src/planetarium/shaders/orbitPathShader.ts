import { Color, ShaderMaterial } from "three";

const ORBIT_PATH_VERTEX_SHADER = /* glsl */ `
  attribute float aPhase;
  varying float vPhase;

  void main() {
    vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ORBIT_PATH_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHeadColor;
  uniform float uHeadPhase;
  uniform float uOpacity;
  uniform float uSelected;
  uniform float uHasHead;
  uniform float uIsOpenRay;

  varying float vPhase;

  void main() {
    if (uHasHead < 0.5) {
      gl_FragColor = vec4(uColor, clamp(uOpacity, 0.0, 1.0));
      return;
    }

    float baseFloor = mix(0.16, 0.28, uSelected);
    float tailPower = mix(2.35, 1.75, uSelected);

    if (uIsOpenRay > 0.5) {
      // Historical spacecraft mission trajectory (e.g. Voyager 1):
      // Crisp, steady flown track from launch through planetary flybys up to the probe,
      // and a subtle dashed future projection ahead into interstellar space.
      float intensity = baseFloor;
      float headGlow = 0.0;
      if (vPhase <= uHeadPhase) {
        float distBehind = uHeadPhase - vPhase;
        headGlow = exp(-distBehind * 38.0);
        // Steady readable historical arc with a gentle lift near the spacecraft
        intensity = mix(0.62, 0.88, uSelected) + 0.12 * exp(-distBehind * 6.0);
      } else {
        // Subtle dashed future trajectory vector ahead of the spacecraft
        float dash = smoothstep(0.38, 0.62, fract(vPhase * 56.0));
        intensity = mix(0.18, 0.30, uSelected) * dash;
      }

      vec3 finalColor = mix(uColor, uHeadColor, headGlow * 0.65);
      float alpha = clamp(uOpacity * (intensity + headGlow * 0.22), 0.0, 1.0);
      gl_FragColor = vec4(finalColor, alpha);
      return;
    }

    // Closed ellipse: distance behind the body along its true direction of travel
    // (0.0 right at the body, increasing behind it to 1.0 just ahead of it).
    float trailing = fract(uHeadPhase - vPhase);

    // Smoothly soften the tiny 1.5% boundary immediately ahead of the body
    float aheadSmooth = smoothstep(1.0, 0.985, trailing);

    // Luminous comet-tail falloff behind the body + pinpoint immediate wake glow
    float tail = pow(1.0 - trailing, tailPower) * aheadSmooth;
    float headGlow = exp(-trailing * 14.0) * aheadSmooth;

    float intensity = baseFloor + (1.0 - baseFloor) * tail;

    // Gentle starlight-tinted highlight in the immediate wake
    vec3 finalColor = mix(uColor, uHeadColor, headGlow * (0.55 + 0.25 * uSelected));
    float alpha = clamp(uOpacity * (intensity + headGlow * 0.35), 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function createOrbitPathMaterial(
  colorHex: string,
  initialOpacity: number,
  hasHead = true,
  isOpenRay = false
): ShaderMaterial {
  const baseColor = new Color(colorHex);
  const headColor = baseColor.clone().lerp(new Color("#ffffff"), 0.45);

  return new ShaderMaterial({
    vertexShader: ORBIT_PATH_VERTEX_SHADER,
    fragmentShader: ORBIT_PATH_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: baseColor },
      uHeadColor: { value: headColor },
      uHeadPhase: { value: 0 },
      uOpacity: { value: initialOpacity },
      uSelected: { value: 0 },
      uHasHead: { value: hasHead ? 1.0 : 0.0 },
      uIsOpenRay: { value: isOpenRay ? 1.0 : 0.0 }
    },
    transparent: true,
    depthWrite: false
  });
}
