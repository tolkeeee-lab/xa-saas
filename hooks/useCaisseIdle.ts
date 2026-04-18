'use client';

/**
 * useCaisseIdle — idle-timeout hook for the POS (caisse) interface.
 *
 * Listens to user-activity events on `window`.  If no activity is detected
 * within `timeoutMs` milliseconds the caisse is automatically locked and the
 * optional `onLock` callback is called.
 *
 * The hook is a no-op during SSR.
 *
 * Usage:
 *   const { isLocked, lock, unlock } = useCaisseIdle({ onLock: () => … });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Default inactivity timeout: 10 minutes. */
export const CAISSE_IDLE_TIMEOUT_MS = 10 * 60 * 1_000;

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
] as const;

export interface UseCaisseIdleOptions {
  /**
   * Called immediately when the idle timeout fires.
   * The caisse is already locked when this runs.
   */
  onLock?: () => void;
  /** Inactivity threshold in ms.  Defaults to {@link CAISSE_IDLE_TIMEOUT_MS}. */
  timeoutMs?: number;
}

export interface UseCaisseIdleResult {
  /** Whether the caisse is currently locked. */
  isLocked: boolean;
  /** Lock the caisse immediately (e.g. manual "Verrouiller" button). */
  lock: () => void;
  /**
   * Unlock the caisse and restart the idle timer.
   * Call this after a successful caisse re-authentication.
   */
  unlock: () => void;
}

export function useCaisseIdle({
  onLock,
  timeoutMs = CAISSE_IDLE_TIMEOUT_MS,
}: UseCaisseIdleOptions = {}): UseCaisseIdleResult {
  const [isLocked, setIsLocked] = useState(false);

  // Refs so callbacks never go stale inside event listeners / timers.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLockedRef = useRef(false);
  const onLockRef = useRef(onLock);
  const timeoutMsRef = useRef(timeoutMs);

  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    timeoutMsRef.current = timeoutMs;
  }, [timeoutMs]);

  /** Restart the countdown; has no effect if already locked. */
  const startTimer = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isLockedRef.current = true;
      setIsLocked(true);
      onLockRef.current?.();
    }, timeoutMsRef.current);
  }, []);

  /** Lock the caisse immediately. */
  const lock = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    isLockedRef.current = true;
    setIsLocked(true);
  }, []);

  /** Unlock the caisse and restart the idle timer. */
  const unlock = useCallback(() => {
    isLockedRef.current = false;
    setIsLocked(false);
    startTimer();
  }, [startTimer]);

  /** Attach activity listeners and start the initial timer. */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleActivity() {
      // Ignore events while already locked — the user must go through the
      // lock screen instead of inadvertently resetting the timer.
      if (!isLockedRef.current) startTimer();
    }

    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // Kick off the first countdown.
    startTimer();

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [startTimer]);

  return { isLocked, lock, unlock };
}
