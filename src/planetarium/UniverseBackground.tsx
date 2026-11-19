import { useEffect, useMemo } from "react";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  MeshBasicMaterial,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry
} from "three";
import { MILKY_WAY_TEXTURE } from "./data/textures";
import { useTextureAsset } from "./hooks/usePlanetTexture";

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
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color = new Color(baseColor);

    for (let i = 0; i < count; i += 1) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const distance = radius * (0.4 + Math.random() * 0.6);
      const sqrt = Math.sqrt(1 - u * u);

      pos[i * 3] = distance * sqrt * Math.cos(theta);
      pos[i * 3 + 1] = distance * u;
      pos[i * 3 + 2] = distance * sqrt * Math.sin(theta);

      const brightness = 1 - Math.random() * brightnessJitter;
      col[i * 3] = color.r * brightness;
      col[i * 3 + 1] = color.g * brightness;
      col[i * 3 + 2] = color.b * brightness;
    }

    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(pos, 3));
    geom.setAttribute("color", new BufferAttribute(col, 3));
    return geom;
  }, [count, radius, baseColor, brightnessJitter]);

  const material = useMemo(
    () =>
      new PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity,
        depthWrite: false,
        sizeAttenuation: true
      }),
    [size, opacity]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

interface UniverseBackgroundProps {
  isLowEnd?: boolean;
  isIntegratedGpu?: boolean;
  prefersReducedMotion?: boolean;
  useMilkyWay?: boolean;
}

export default function UniverseBackground({
  isLowEnd = false,
  isIntegratedGpu = false,
  prefersReducedMotion = false,
  useMilkyWay = false
}: UniverseBackgroundProps) {
  const milkyWayMap = useTextureAsset(useMilkyWay ? MILKY_WAY_TEXTURE : null);

  const milkyWayGeometry = useMemo(() => new SphereGeometry(500, 32, 24), []);
  const voidGeometry = useMemo(() => new SphereGeometry(500, 24, 16), []);

  const milkyWayMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        map: milkyWayMap ?? null,
        side: BackSide,
        depthWrite: false
      }),
    [milkyWayMap]
  );

  const voidMaterial = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        uniforms: {
          colorInner: { value: new Color("#0c1624") },
          colorOuter: { value: new Color("#04060d") }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 colorInner;
          uniform vec3 colorOuter;
          void main() {
            float dist = distance(vUv, vec2(0.5));
            float vignette = smoothstep(0.15, 0.85, dist);
            vec3 color = mix(colorInner, colorOuter, vignette);
            gl_FragColor = vec4(color, 1.0);
          }
        `
      }),
    []
  );

  useEffect(() => {
    return () => {
      milkyWayGeometry.dispose();
      voidGeometry.dispose();
      voidMaterial.dispose();
    };
  }, [milkyWayGeometry, voidGeometry, voidMaterial]);

  useEffect(() => {
    return () => {
      milkyWayMaterial.dispose();
    };
  }, [milkyWayMaterial]);

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

    if (isIntegratedGpu) {
      return [
        {
          count: 650,
          radius: 260,
          size: 0.8,
          opacity: 0.8,
          baseColor: "#dfe7ff",
          brightnessJitter: 0.5
        },
        {
          count: 480,
          radius: 320,
          size: 0.5,
          opacity: 0.55,
          baseColor: "#b6c3d9",
          brightnessJitter: 0.65
        },
        {
          count: 160,
          radius: 200,
          size: 1.4,
          opacity: 0.15,
          baseColor: "#6a5a8a",
          brightnessJitter: 0.4
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
  }, [isIntegratedGpu, isLowEnd, prefersReducedMotion]);

  if (useMilkyWay && milkyWayMap) {
    return (
      <mesh
        geometry={milkyWayGeometry}
        material={milkyWayMaterial}
        frustumCulled={false}
      />
    );
  }

  return (
    <>
      <mesh
        geometry={voidGeometry}
        material={voidMaterial}
        frustumCulled={false}
      />

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
