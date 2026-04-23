import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

/**
 * StreamingText — reveals text word by word.
 *
 * Two modes:
 *   1) FAKE STREAMING (default, current): Pass `text`. Component reveals
 *      it word by word at `wordDelayMs` interval. Identical UX to real streaming.
 *
 *   2) REAL STREAMING (future, when backend has SSE): Pass `stream` (an async
 *      iterable of string chunks). Component appends each chunk as it arrives.
 *
 * Switch from fake to real: just stop passing `text` and start passing `stream`.
 * No other changes needed.
 *
 * Props:
 *   text          — full string (fake streaming mode)
 *   stream        — async iterable of string chunks (real streaming mode)
 *   wordDelayMs   — for fake mode: delay between words (default 45ms)
 *   onComplete    — called when fully revealed
 *   style         — text style
 */
export default function StreamingText({
  text,
  stream,
  wordDelayMs = 45,
  onComplete,
  style,
  fontFamily,
}) {
  const [displayed, setDisplayed] = useState('');
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    completedRef.current = false;
    setDisplayed('');

    // ─── REAL STREAMING MODE ───
    if (stream) {
      (async () => {
        let acc = '';
        try {
          for await (const chunk of stream) {
            if (cancelledRef.current) return;
            acc += chunk;
            setDisplayed(acc);
          }
        } catch (e) {
          // stream interrupted
        }
        if (!cancelledRef.current && !completedRef.current) {
          completedRef.current = true;
          if (onComplete) onComplete();
        }
      })();
      return () => { cancelledRef.current = true; };
    }

    // ─── FAKE STREAMING MODE (from full text) ───
    if (!text) return;
    // Tokenize by word (preserve spacing/punctuation as part of next word)
    const words = text.split(/(\s+)/); // keeps separators
    let idx = 0;
    let acc = '';

    const tick = () => {
      if (cancelledRef.current) return;
      if (idx >= words.length) {
        completedRef.current = true;
        if (onComplete) onComplete();
        return;
      }
      acc += words[idx];
      idx++;
      setDisplayed(acc);
      // Variable delay: longer for sentence ends, shorter mid-sentence
      const lastChar = words[idx - 1].slice(-1);
      const isSentenceEnd = ['.', '!', '?', '।'].includes(lastChar);
      const isPause = [',', ';', ':'].includes(lastChar);
      const delay = isSentenceEnd ? wordDelayMs * 6
                  : isPause ? wordDelayMs * 3
                  : wordDelayMs;
      setTimeout(tick, delay);
    };

    // Start after one frame so initial render is empty
    const startTimer = setTimeout(tick, 80);
    return () => {
      cancelledRef.current = true;
      clearTimeout(startTimer);
    };
  }, [text, stream]);

  return (
    <Text style={[style, fontFamily && { fontFamily }]}>
      {displayed}
    </Text>
  );
}