import { useMemo } from "react";
import { Color, BackSide } from "three";

interface StarLayerProps {
  count: number;
  radius: number;
  size: number;
  opacity: number;
  baseColor: string;
  brightnessJitter: number;
}

function StarLayer({
  count,
  radius,
  size,
  opacity,
  baseColor,
  brightnessJitter
}: StarLayerProps) {
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color = new Color(baseColor);

    for (let i = 0; i < count; i += 1) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const distance = radius * (0.4 + Math.random() * 0.6);
      const sqrt = Math.sqrt(1 - u * u);

      const x = distance * sqrt * Math.cos(theta);
      const y = distance * u;
      const z = distance * sqrt * Math.sin(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const brightness = 1 - Math.random() * brightnessJitter;
      const tinted = color.clone().multiplyScalar(brightness);
      col[i * 3] = tinted.r;
      col[i * 3 + 1] = tinted.g;
      col[i * 3 + 2] = tinted.b;
    }

    return { positions: pos, colors: col };
  }, [count, radius, baseColor, brightnessJitter]);

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={positions.length / 3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          itemSize={3}
          count={colors.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

interface UniverseBackgroundProps {
  isLowEnd?: boolean;
  prefersReducedMotion?: boolean;
}

export default function UniverseBackground({
  isLowEnd = false,
  prefersReducedMotion = false
}: UniverseBackgroundProps) {
  const layers = useMemo(() => {
    if (isLowEnd || prefersReducedMotion) {
      return [
        {
          count: 420,
          radius: 240,
          size: 0.6,
          opacity: 0.75,
          baseColor: "#dfe7ff",
          brightnessJitter: 0.55
        },
        {
          count: 260,
          radius: 280,
          size: 0.45,
          opacity: 0.5,
          baseColor: "#b6c3d9",
          brightnessJitter: 0.7
        }
      ];
    }

    return [
      {
        count: 900,
        radius: 260,
        size: 0.8,
        opacity: 0.8,
        baseColor: "#dfe7ff",
        brightnessJitter: 0.5
      },
      {
        count: 700,
        radius: 320,
        size: 0.5,
        opacity: 0.55,
        baseColor: "#b6c3d9",
        brightnessJitter: 0.65
      },
      {
        count: 220,
        radius: 200,
        size: 1.4,
        opacity: 0.15,
        baseColor: "#6a5a8a",
        brightnessJitter: 0.4
      }
    ];
  }, [isLowEnd, prefersReducedMotion]);

  return (
    <>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[500, 48, 32]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          uniforms={{
            colorInner: { value: new Color("#0c1624") },
            colorOuter: { value: new Color("#04060d") }
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform vec3 colorInner;
            uniform vec3 colorOuter;
            void main() {
              float dist = distance(vUv, vec2(0.5));
              float vignette = smoothstep(0.15, 0.85, dist);
              vec3 color = mix(colorInner, colorOuter, vignette);
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>

      {layers.map((layer, index) => (
        <StarLayer
          key={`${layer.count}-${index}`}
          count={layer.count}
          radius={layer.radius}
          size={layer.size}
          opacity={layer.opacity}
          baseColor={layer.baseColor}
          brightnessJitter={layer.brightnessJitter}
        />
      ))}
    </>
  );
}
