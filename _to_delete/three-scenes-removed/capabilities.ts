import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Capability checks for the WebGL scenes.
 *
 * This module deliberately imports nothing from three.js: it is evaluated in
 * the main bundle to decide *whether* a scene should load at all, so devices
 * that cannot (or should not) render 3D never download the three.js chunk.
 */

let cachedSupport: boolean | null = null;

/** One-off WebGL probe; the test context is released immediately. */
export const supportsWebGL = (): boolean => {
  if (cachedSupport !== null) return cachedSupport;
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    cachedSupport = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return cachedSupport;
  } catch {
    cachedSupport = false;
    return false;
  }
};

/**
 * True when a WebGL scene is appropriate here: the device supports it, the
 * visitor has not asked for reduced motion, the screen is wide enough to be
 * worth the GPU budget, and the machine does not look underpowered.
 */
export const useCanRender3D = ({ minWidth = 0 }: { minWidth?: number } = {}) => {
  const reduce = useReducedMotion();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (reduce) {
      setOk(false);
      return;
    }
    // Bail out only on genuinely tiny devices. Core counts are a poor proxy —
    // plenty of capable laptops and VMs report 2 — so this checks for the
    // extremes rather than guessing at a performance tier.
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (cores === 1 || (typeof memory === 'number' && memory <= 1)) {
      setOk(false);
      return;
    }
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setOk(mq.matches && supportsWebGL());
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [minWidth, reduce]);

  return ok;
};

/** Mounts heavy content only once the element approaches the viewport. */
export const useNearViewport = <T extends HTMLElement>(rootMargin = '500px') => {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setNear(true),
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return { ref, near };
};

/** Tracks whether an element is on screen, for pausing the render loop. */
export const useOnScreen = <T extends HTMLElement>(ref: React.RefObject<T>, rootMargin = '150px') => {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => setOnScreen(entries[0]?.isIntersecting ?? true), {
      rootMargin,
    });
    observer.observe(el);
    const onVisibility = () => setOnScreen(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref, rootMargin]);

  return onScreen;
};
