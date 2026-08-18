import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from '@/components/site/three/Stage';

/**
 * Depth particle field for the dark sections — slow drifting motes at several
 * distances, parallaxing with scroll and pointer. Rendered as a single
 * additive Points draw call, so it costs one geometry and no per-particle
 * objects.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uMouse;
  uniform float uPixelRatio;

  attribute float aScale;
  attribute float aSpeed;
  attribute float aPhase;

  varying float vDepth;
  varying float vTwinkle;

  void main() {
    vec3 pos = position;

    // Gentle vertical drift plus a lateral sway, unique per particle.
    pos.y += sin(uTime * aSpeed + aPhase) * 0.35;
    pos.x += cos(uTime * aSpeed * 0.7 + aPhase) * 0.25;

    // Parallax: nearer particles (larger z) react more.
    float depth = (pos.z + 6.0) / 12.0;      // 0 far .. 1 near
    pos.x += uMouse.x * depth * 1.6;
    pos.y += uMouse.y * depth * 1.1 + uScroll * depth * 2.2;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * (28.0 / -mv.z);

    vDepth = depth;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (aSpeed * 2.2) + aPhase * 2.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;

  varying float vDepth;
  varying float vTwinkle;

  void main() {
    // Round, soft-edged sprite without a texture.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, d);

    vec3 color = mix(uColorFar, uColorNear, vDepth);
    gl_FragColor = vec4(color, alpha * vTwinkle * mix(0.18, 0.75, vDepth));
  }
`;

const Motes = ({
  count,
  scrollRef,
  near,
  far,
}: {
  count: number;
  scrollRef: React.MutableRefObject<number>;
  near: string;
  far: string;
}) => {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2());
  const smoothed = useRef(new THREE.Vector2());

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = -6 + Math.random() * 12;
      scales[i] = 1.5 + Math.random() * 5;
      speeds[i] = 0.15 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uPixelRatio: { value: Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio) },
      uColorNear: { value: new THREE.Color(near) },
      uColorFar: { value: new THREE.Color(far) },
    }),
    [near, far]
  );

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.set(event.clientX / window.innerWidth - 0.5, 0.5 - event.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    if (!material.current) return;
    smoothed.current.lerp(pointer.current, Math.min(1, delta * 1.6));
    const u = material.current.uniforms;
    u.uTime.value += delta;
    u.uMouse.value.copy(smoothed.current);
    u.uScroll.value += (scrollRef.current - u.uScroll.value) * Math.min(1, delta * 3);
    if (points.current) points.current.rotation.z += delta * 0.008;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const ParticleField = ({
  count = 260,
  near = '#a8e6a3',
  far = '#2f6b46',
}: {
  count?: number;
  near?: string;
  far?: string;
}) => {
  const scrollRef = useRef(0);
  const hostRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => {
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // -1 (section below the fold) .. 1 (section above it)
      scrollRef.current = Math.max(-1, Math.min(1, 1 - (rect.top + rect.height / 2) / window.innerHeight));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0">
      <Stage camera={{ position: [0, 0, 7], fov: 55 }} maxDpr={1.5}>
        <Motes count={count} scrollRef={scrollRef} near={near} far={far} />
      </Stage>
    </div>
  );
};

export default ParticleField;
