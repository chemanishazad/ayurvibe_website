import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from '@/components/site/three/Stage';

export interface CarouselItem {
  slug: string;
  name: string;
  duration: string;
  category: string;
  image: string;
}

/**
 * Therapy carousel.
 *
 * The therapy photographs are mapped onto planes arranged around a vertical
 * cylinder in real 3D space. Scrolling the section spins the cylinder; the
 * pointer can drag it directly, and the card facing the camera is reported back
 * to React so the surrounding DOM can show its details (and stay readable for
 * crawlers and screen readers).
 */

const RADIUS = 4.4;
const CARD_W = 1.72;
const CARD_H = 2.25;

/** Rounded-rectangle plane so the photos do not read as hard rectangles. */
const useCardGeometry = () =>
  useMemo(() => {
    const shape = new THREE.Shape();
    const w = CARD_W / 2;
    const h = CARD_H / 2;
    const r = 0.18;
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    const geo = new THREE.ShapeGeometry(shape, 12);
    // ShapeGeometry has no UVs in the 0..1 range — rebuild them from position.
    const pos = geo.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + w) / (w * 2);
      uv[i * 2 + 1] = (pos.getY(i) + h) / (h * 2);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return geo;
  }, []);

const Card = ({
  texture,
  angle,
  rotationRef,
  geometry,
}: {
  texture: THREE.Texture;
  angle: number;
  rotationRef: React.MutableRefObject<number>;
  geometry: THREE.BufferGeometry;
}) => {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const theta = angle + rotationRef.current;
    g.position.set(Math.sin(theta) * RADIUS, 0, Math.cos(theta) * RADIUS);
    g.rotation.y = theta;

    // Depth cueing: cards turn away, shrink and fade, and the far half of the
    // ring is skipped altogether rather than showing through.
    const facing = Math.cos(theta); // 1 = toward camera, -1 = behind
    const t = Math.max(0, facing);
    g.visible = facing > -0.05;
    g.scale.setScalar(0.72 + t * 0.36);
    if (material.current) material.current.opacity = Math.pow(t, 0.7) * 0.95 + 0.05;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshBasicMaterial ref={material} map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

const Ring = ({
  items,
  rotationRef,
  onFacingChange,
}: {
  items: CarouselItem[];
  rotationRef: React.MutableRefObject<number>;
  onFacingChange: (index: number) => void;
}) => {
  const textures = useLoader(
    THREE.TextureLoader,
    items.map((i) => i.image)
  );
  const geometry = useCardGeometry();
  const { gl } = useThree();
  const facing = useRef(-1);

  React.useEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy?.() ?? 1;
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(4, max);
      t.needsUpdate = true;
    });
    return () => {
      textures.forEach((t) => t.dispose());
      geometry.dispose();
    };
  }, [textures, geometry, gl]);

  const step = (Math.PI * 2) / items.length;

  useFrame(() => {
    // Pick the card whose own angle is most toward the camera, using the same
    // maths the cards position themselves with.
    let best = 0;
    let bestFacing = -2;
    for (let i = 0; i < items.length; i++) {
      const value = Math.cos(i * step + rotationRef.current);
      if (value > bestFacing) {
        bestFacing = value;
        best = i;
      }
    }
    if (best !== facing.current) {
      facing.current = best;
      onFacingChange(best);
    }
  });

  return (
    // Lifted slightly so the DOM detail panel at the bottom left stays clear of
    // the front card.
    <group position={[0, 0.42, -RADIUS]}>
      {items.map((item, i) => (
        <Card
          key={item.slug}
          texture={textures[i]}
          angle={i * step}
          rotationRef={rotationRef}
          geometry={geometry}
        />
      ))}
    </group>
  );
};

const TherapyCarousel = ({
  items,
  progressRef,
  onFacingChange,
}: {
  items: CarouselItem[];
  /** 0..1 through the pinned section; spins the ring. */
  progressRef: React.MutableRefObject<number>;
  onFacingChange?: (index: number) => void;
}) => {
  const rotationRef = useRef(0);
  const dragRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);

  const Driver = () => {
    useFrame((_, delta) => {
      // One full turn across the pinned scroll, plus whatever the pointer added.
      const target = progressRef.current * Math.PI * 2 + dragRef.current;
      rotationRef.current += (target - rotationRef.current) * Math.min(1, delta * 3.4);
    });
    return null;
  };

  return (
    <div
      className={dragging ? 'cursor-grabbing' : 'cursor-grab'}
      onPointerDown={(e) => {
        setDragging(true);
        lastX.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        dragRef.current += (e.clientX - lastX.current) * 0.005;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Stage camera={{ position: [0, 0.1, 6.6], fov: 40 }} maxDpr={1.6}>
        <Suspense fallback={null}>
          <Driver />
          <Ring items={items} rotationRef={rotationRef} onFacingChange={onFacingChange ?? (() => undefined)} />
        </Suspense>
      </Stage>
    </div>
  );
};

export default TherapyCarousel;
