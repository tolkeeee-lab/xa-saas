'use client';

import { useEffect, useRef } from 'react';

/**
 * useScannerInput — detects barcode-scanner (USB douchette) input.
 *
 * A scanner typically sends each character with < 20ms between keystrokes,
 * followed by Enter.  We use a 100 ms idle-timer to flush the buffer.
 *
 * @param onScan  Called with the scanned barcode string when detected.
 * @param enabled  Whether the hook is active (default: true).
 */
export function useScannerInput(
  onScan: (barcode: string) => void,
  enabled = true,
) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if an input/textarea/select has focus (user is typing)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        // Flush immediately on Enter
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';
        // Minimum barcode length: 4 chars
        if (barcode.length >= 4) {
          onScan(barcode);
        }
        return;
      }

      // Only accept printable single characters from a scanner
      if (e.key.length === 1) {
        // If gap > 200ms, start fresh (human typing, not scanner)
        if (gap > 200 && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;

        // Cancel existing flush timer and set a new one
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(() => {
          const barcode = bufferRef.current.trim();
          bufferRef.current = '';
          // After the idle timeout, process any buffered barcode regardless of gap.
          if (barcode.length >= 4) {
            onScan(barcode);
          }
        }, 100);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, [onScan, enabled]);
}
