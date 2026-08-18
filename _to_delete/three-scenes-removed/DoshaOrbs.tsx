import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from '@/components/site/three/Stage';
import { SIMPLEX_3D } from '@/components/site/three/glsl';

/**
 * Dosha orbs.
 *
 * Three lit spheres — air, fire, earth — each with its own displaced,
 * noise-driven surface. The selected orb rotates to the front of the ring and
 * scales up; the other two recede and dim. Selection is owned by React (the
 * tabs below the canvas), so the scene never holds state the DOM needs.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisp;

  ${SIMPLEX_3D}

  void main() {
    vec3 p = position;
    float n = snoise3(normalize(position) * uFreq + vec3(0.0, uTime * 0.25, uTime * 0.12));
    float n2 = snoise3(normalize(position) * (uFreq * 2.3) - vec3(uTime * 0.18, 0.0, 0.0));
    float disp = n * uAmp + n2 * uAmp * 0.35;

    p += normal * disp;

    vDisp = disp;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uGlow;
  uniform float uActive;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisp;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);

    // Key light from the upper left, plus a soft fill.
    vec3 lightDir = normalize(vec3(-0.5, 0.8, 0.6));
    float diffuse = max(dot(normal, lightDir), 0.0);
    float fill = max(dot(normal, normalize(vec3(0.6, -0.3, 0.5))), 0.0) * 0.25;

    // Rim light picks the silhouette out of the background.
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);

    vec3 base = mix(uColorA, uColorB, smoothstep(-0.25, 0.35, vDisp));
    vec3 color = base * (0.35 + diffuse * 0.8 + fill);
    color += uGlow * fresnel * (0.28 + uActive * 0.5);

    // Specular pop on the crests.
    float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 26.0);
    color += vec3(1.0) * spec * 0.28;

    gl_FragColor = vec4(color, 0.92);
  }
`;

export interface OrbSpec {
  name: string;
  colorA: string;
  colorB: string;
  glow: string;
  amp: number;
  freq: number;
}

/** Visual identity per constitution: airy, fiery, earthy. */
export const ORBS: OrbSpec[] = [
  { name: 'Vata', colorA: '#c8dcf5', colorB: '#8fb6e8', glow: '#dbe9ff', amp: 0.22, freq: 1.5 },
  { name: 'Pitta', colorA: '#f6c37a', colorB: '#e2703a', glow: '#ffd9a0', amp: 0.16, freq: 2.1 },
  { name: 'Kapha', colorA: '#8fc79a', colorB: '#2f7a4a', glow: '#bde6c4', amp: 0.11, freq: 1.2 },
];

const Orb = ({
  spec,
  index,
  total,
  activeRef,
}: {
  spec: OrbSpec;
  index: number;
  total: number;
  activeRef: React.MutableRefObject<number>;
}) => {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 10 },
      uAmp: { value: spec.amp },
      uFreq: { value: spec.freq },
      uColorA: { value: new THREE.Color(spec.colorA) },
      uColorB: { value: new THREE.Color(spec.colorB) },
      uGlow: { value: new THREE.Color(spec.glow) },
      uActive: { value: 0 },
    }),
    [spec]
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || !material.current) return;

    const step = (Math.PI * 2) / total;
    // Rotate the ring so the active orb faces front.
    const theta = index * step - activeRef.current * step;
    const targetX = Math.sin(theta) * 3.4;
    const targetZ = Math.cos(theta) * 3.4 - 3.4;

    g.position.x += (targetX - g.position.x) * Math.min(1, delta * 3);
    g.position.z += (targetZ - g.position.z) * Math.min(1, delta * 3);

    const facing = Math.cos(theta);
    const active = Math.max(0, facing);
    const targetScale = 0.52 + active * 0.46;
    const s = g.scale.x + (targetScale - g.scale.x) * Math.min(1, delta * 3);
    g.scale.setScalar(s);
    g.rotation.y += delta * 0.16;

    material.current.uniforms.uTime.value += delta;
    material.current.uniforms.uActive.value +=
      (active - material.current.uniforms.uActive.value) * Math.min(1, delta * 3);
  });

  return (
    <group ref={group} scale={0.8}>
      <mesh>
        <icosahedronGeometry args={[1.15, 24]} />
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
    </group>
  );
};

const Floor = () => (
  // Soft contact shadow so the orbs feel seated rather than floating in a void.
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
    <circleGeometry args={[1.5, 48]} />
    <meshBasicMaterial color="#0f2f1c" transparent opacity={0.09} />
  </mesh>
);

const DoshaOrbs = ({ activeIndex }: { activeIndex: number }) => {
  const activeRef = useRef(activeIndex);
  const smooth = useRef(activeIndex);

  React.useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  const Driver = () => {
    useFrame((_, delta) => {
      // Ease the ring toward the selected index, taking the shortest way round.
      let diff = activeRef.current - smooth.current;
      const total = ORBS.length;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      smooth.current += diff * Math.min(1, delta * 3.2);
    });
    return null;
  };

  return (
    <Stage camera={{ position: [0, 0.1, 6.4], fov: 44 }} maxDpr={1.6}>
      <Driver />
      <Floor />
      {ORBS.map((spec, i) => (
        <Orb key={spec.name} spec={spec} index={i} total={ORBS.length} activeRef={smooth} />
      ))}
    </Stage>
  );
};

export default DoshaOrbs;
