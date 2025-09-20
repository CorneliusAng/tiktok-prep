import { useRef, useState } from 'react';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef(null);

  const startStream = (text, onToken, onDone) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tokens = String(text).split(/\s+/).map(t => t + ' ');
    let i = 0;
    setIsStreaming(true);
    intervalRef.current = setInterval(() => {
      if (i < tokens.length) {
        onToken(tokens[i++]);
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsStreaming(false);
        onDone && onDone();
      }
    }, 60);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsStreaming(false);
    }
  };

  return { isStreaming, startStream, stop };
}
