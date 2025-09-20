export async function* readTextStream(readableStream) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line) yield line;
      }
    }
    if (buf) yield buf;
  } finally {
    reader.releaseLock();
  }
}


