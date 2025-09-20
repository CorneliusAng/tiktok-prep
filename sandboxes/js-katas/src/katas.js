export function mapPolyfill(array, callback, thisArg) {
  if (!Array.isArray(array)) throw new TypeError('mapPolyfill expects an array');
  if (typeof callback !== 'function') throw new TypeError('callback must be a function');
  const result = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    if (i in array) {
      result[i] = callback.call(thisArg, array[i], i, array);
    }
  }
  return result;
}

export function filterPolyfill(array, predicate, thisArg) {
  if (!Array.isArray(array)) throw new TypeError('filterPolyfill expects an array');
  if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (i in array) {
      const val = array[i];
      if (predicate.call(thisArg, val, i, array)) result.push(val);
    }
  }
  return result;
}

export function reducePolyfill(array, reducer, initialValue) {
  if (!Array.isArray(array)) throw new TypeError('reducePolyfill expects an array');
  if (typeof reducer !== 'function') throw new TypeError('reducer must be a function');
  let hasInit = arguments.length >= 3;
  let acc = initialValue;
  let i = 0;

  if (!hasInit) {
    while (i < array.length && !(i in array)) i++;
    if (i >= array.length) throw new TypeError('Reduce of empty array with no initial value');
    acc = array[i++];
  }

  for (; i < array.length; i++) {
    if (i in array) acc = reducer(acc, array[i], i, array);
  }
  return acc;
}

export function debounce(fn, waitMs = 0) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  let timer = null;
  return function debounced(...args) {
    const ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(ctx, args);
    }, waitMs);
  };
}

export function throttle(fn, intervalMs = 0) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  let last = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - last >= intervalMs) {
      last = now;
      return fn.apply(this, args);
    }
  };
}

export async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 150) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && (res.status === 429 || res.status >= 500)) {
        if (attempt >= retries) return res;
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
      attempt++;
    }
  }
}

export function lruFactory(capacity) {
  if (!Number.isInteger(capacity) || capacity <= 0) throw new TypeError('capacity must be a positive integer');
  const map = new Map();
  return {
    set(key, value) {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      if (map.size > capacity) {
        const oldestKey = map.keys().next().value;
        map.delete(oldestKey);
      }
    },
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    has(key) {
      return map.has(key);
    },
    size() {
      return map.size;
    }
  };
}
