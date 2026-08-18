import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from '@/components/site/three/Stage';
import { FBM, SIMPLEX_2D } from '@/components/site/three/glsl';

/**
 * Hero backdrop.
 *
 * A single full-screen quad running a domain-warped fbm field in the brand
 * palette — light mint and green over white, with a faint saffron bloom. The
 * warp follows the pointer and drifts with scroll, so the surface behind the
 * headline is always subtly moving without ever competing with the text.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fullscreen quad: bypass the camera entirely.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uMouse;      // -0.5..0.5
  uniform float uScroll;     // 0..1 through the hero
  uniform float uAspect;
  uniform vec3  uBase;
  uniform vec3  uMint;
  uniform vec3  uGreen;
  uniform vec3  uGold;

  ${SIMPLEX_2D}
  ${FBM}

  void main() {
    vec2 uv = vUv;
    uv.x *= uAspect;

    float t = uTime * 0.045;

    // Domain warp: noise displacing the lookup of more noise.
    vec2 warp = vec2(
      fbm(uv * 1.6 + vec2(t, -t * 0.7) + uMouse * 0.5),
      fbm(uv * 1.6 + vec2(-t * 0.8, t) + uMouse.yx * 0.5)
    );

    float field = fbm(uv * 2.1 + warp * 0.9 - vec2(0.0, uScroll * 0.6));
    float ridge = fbm(uv * 3.4 - warp * 0.6 + vec2(t * 1.4, 0.0));

    // Soft, wide bands rather than hard contrast — this sits behind body text.
    float mintMask  = smoothstep(-0.15, 0.75, field);
    float greenMask = smoothstep(0.25, 0.95, field + ridge * 0.35);
    float goldMask  = smoothstep(0.55, 1.05, ridge) * 0.5;

    vec3 color = uBase;
    color = mix(color, uMint, mintMask * 0.55);
    color = mix(color, uGreen, greenMask * 0.32);
    color = mix(color, uGold, goldMask * 0.28);

    // Vignette toward the page background so the canvas edge is invisible.
    vec2 c = vUv - 0.5;
    float vignette = smoothstep(0.85, 0.15, length(c * vec2(uAspect * 0.75, 1.0)));
    color = mix(uBase, color, vignette);

    // Fade the whole field out as the hero scrolls away.
    float alpha = (0.85 - uScroll * 0.55) * vignette;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

const Field = ({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) => {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const pointer = useRef(new THREE.Vector2(0, 0));
  const smoothed = useRef(new THREE.Vector2(0, 0));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uAspect: { value: 1 },
      uBase: { value: new THREE.Color('#ffffff') },
      uMint: { value: new THREE.Color('#dcefe0') },
      uGreen: { value: new THREE.Color('#b6dcc0') },
      uGold: { value: new THREE.Color('#f7e2b8') },
    }),
    []
  );

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.set(event.clientX / window.innerWidth - 0.5, 0.5 - event.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, delta) => {
    if (!material.current) return;
    smoothed.current.lerp(pointer.current, Math.min(1, delta * 2.2));
    const u = material.current.uniforms;
    u.uTime.value += delta;
    u.uMouse.value.copy(smoothed.current);
    u.uScroll.value += (scrollRef.current - u.uScroll.value) * Math.min(1, delta * 4);
    u.uAspect.value = size.width / Math.max(1, size.height);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

const HeroBackdrop = () => {
  const scrollRef = useRef(0);

  React.useEffect(() => {
    const onScroll = () => {
      scrollRef.current = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Stage maxDpr={1.5}>
      <Field scrollRef={scrollRef} />
    </Stage>
  );
};

export default HeroBackdrop;
