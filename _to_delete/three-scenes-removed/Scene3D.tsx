import React, { Suspense, lazy } from 'react';
import { useCanRender3D, useNearViewport } from '@/components/site/three/capabilities';
import type { CarouselItem } from '@/components/site/three/TherapyCarousel';

/**
 * Gateway to every WebGL scene.
 *
 * Each scene is its own dynamic import, so a page only ever downloads the
 * three.js chunk for the scenes it actually shows — and only once that section
 * is close to the viewport, on a device that can render it, for a visitor who
 * has not asked for reduced motion. In every other case the `fallback` renders
 * instead, which is always the plain CSS version of the same section.
 */

const scenes = {
  hero: lazy(() => import('@/components/site/three/HeroBackdrop')),
  particles: lazy(() => import('@/components/site/three/ParticleField')),
  carousel: lazy(() => import('@/components/site/three/TherapyCarousel')),
  orbs: lazy(() => import('@/components/site/three/DoshaOrbs')),
} as const;

type SceneProps =
  | { name: 'hero' }
  | { name: 'particles'; count?: number; near?: string; far?: string }
  | {
      name: 'carousel';
      items: CarouselItem[];
      progressRef: React.MutableRefObject<number>;
      onFacingChange?: (index: number) => void;
    }
  | { name: 'orbs'; activeIndex: number };

const Scene3D = ({
  fallback = null,
  className,
  minWidth = 0,
  ...scene
}: SceneProps & {
  /** Rendered whenever WebGL is skipped — must contain the real content. */
  fallback?: React.ReactNode;
  className?: string;
  /** Skip WebGL below this viewport width. */
  minWidth?: number;
}) => {
  const can3D = useCanRender3D({ minWidth });
  const { ref, near } = useNearViewport<HTMLDivElement>();

  const Component = scenes[scene.name] as React.ComponentType<Record<string, unknown>>;
  const { name, ...props } = scene;

  return (
    <div ref={ref} className={className}>
      {can3D && near ? (
        <Suspense fallback={fallback}>
          <Component {...(props as Record<string, unknown>)} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

export default Scene3D;
export type { CarouselItem };
