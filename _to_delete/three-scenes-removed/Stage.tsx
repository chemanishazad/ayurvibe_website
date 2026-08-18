import React, { useRef } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import { useOnScreen } from '@/components/site/three/capabilities';

/**
 * Canvas shell shared by every scene.
 *
 * Lives inside the lazily-loaded three.js chunk. Rendering pauses whenever the
 * canvas is off screen or the tab is hidden, and the device pixel ratio is
 * capped so retina laptops do not pay 4x fill rate for a decorative scene.
 */
const Stage = ({
  children,
  camera,
  maxDpr = 1.75,
  className,
  style,
  ...rest
}: {
  children: React.ReactNode;
  camera?: CanvasProps['camera'];
  maxDpr?: number;
  className?: string;
  style?: React.CSSProperties;
} & Omit<CanvasProps, 'children' | 'camera' | 'dpr'>) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(hostRef);

  return (
    <div ref={hostRef} className={className} style={{ position: 'absolute', inset: 0, ...style }}>
      <Canvas
        frameloop={onScreen ? 'always' : 'never'}
        dpr={[1, maxDpr]}
        camera={camera ?? { position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        {...rest}
      >
        {children}
      </Canvas>
    </div>
  );
};

export default Stage;
