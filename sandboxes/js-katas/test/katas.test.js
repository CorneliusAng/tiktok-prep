import test from 'node:test';
import assert from 'node:assert/strict';
import {
  debounce,
  throttle,
  mapPolyfill,
  filterPolyfill,
  reducePolyfill,
  lruFactory
} from '../src/katas.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

test('debounce coalesces calls (trailing)', async () => {
  let calls = [];
  const d = debounce((x) => calls.push(x), 40);
  d(1);
  d(2);
  d(3);
  await sleep(70);
  assert.deepEqual(calls, [3]);
});

test('throttle limits call frequency (leading)', async () => {
  let count = 0;
  const t = throttle(() => { count++; }, 40);
  const id = setInterval(() => t(), 10);
  await sleep(120);
  clearInterval(id);
  // ~3 calls expected (t≈0,40,80). Allow a small range for timing variance.
  assert.ok(count >= 2 && count <= 4, `count=${count}`);
});

test('map/filter/reduce happy paths', () => {
  const arr = [1, 2, 3];
  assert.deepEqual(mapPolyfill(arr, x => x * 2), [2, 4, 6]);
  assert.deepEqual(filterPolyfill(arr, x => x % 2 === 1), [1, 3]);
  assert.equal(reducePolyfill(arr, (a, x) => a + x, 0), 6);
});

test('LRU basic behavior', () => {
  const lru = lruFactory(2);
  lru.set('a', 1);
  lru.set('b', 2);
  assert.equal(lru.size(), 2);
  assert.equal(lru.get('a'), 1); // a becomes most-recent
  lru.set('c', 3);               // evicts b
  assert.equal(lru.has('b'), false);
  assert.equal(lru.has('a'), true);
  assert.equal(lru.has('c'), true);
});
