import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'touchstart', 'scroll'];
const CHECK_INTERVAL_MS = 15_000;

/**
 * Calls onIdle once `timeoutMs` passes with no mouse/keyboard/touch/scroll
 * activity, while `active` is true. onIdle is read from a ref (same pattern
 * as AdminLayout's usePolledCount) so the effect doesn't need to re-run —
 * and therefore doesn't reset the idle clock — just because the caller
 * re-rendered with a new inline callback.
 */
export function useIdleLogout(active, timeoutMs, onIdle) {
  const lastActivityRef = useRef(Date.now());
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!active) return;
    lastActivityRef.current = Date.now();
    const markActive = () => { lastActivityRef.current = Date.now(); };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= timeoutMs) onIdleRef.current();
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      clearInterval(interval);
    };
  }, [active, timeoutMs]);
}
