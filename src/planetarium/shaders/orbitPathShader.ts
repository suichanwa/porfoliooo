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
      // Open escape trajectory (e.g. Voyager 1): bright wake trailing back toward the Sun,
      // delicate whisper ahead into interstellar space with no circular wraparound seam.
      float intensity = baseFloor;
      float headGlow = 0.0;
      if (vPhase <= uHeadPhase) {
        float trailing = (uHeadPhase - vPhase) / max(uHeadPhase, 0.001);
        float tail = pow(1.0 - trailing, tailPower);
        headGlow = exp(-trailing * 12.0);
        intensity = baseFloor + (1.0 - baseFloor) * tail;
      } else {
        // Gentle dotted projection beyond current probe distance
        float dash = smoothstep(0.35, 0.65, fract(vPhase * 42.0));
        intensity = baseFloor * (0.45 + 0.55 * dash);
      }

      vec3 finalColor = mix(uColor, uHeadColor, headGlow * (0.55 + 0.25 * uSelected));
      float alpha = clamp(uOpacity * (intensity + headGlow * 0.35), 0.0, 1.0);
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
