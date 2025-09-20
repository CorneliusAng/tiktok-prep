// Scratchpad
// Example: node src/scratch.mjs
import { mapPolyfill } from './katas.js';
console.log(mapPolyfill([1,2,3], x => x * 10));
const users = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 24 },
    { id: 3, name: 'Charlie', age: 35 },
  ];

  const userNames = users.map((user) => user.name);
  console.log(userNames);

  const userNamesWithOld = users.map((user) => ({
      ...user,
      status: user.age > 25 ? 'old' : 'young',
  }))
  console.log(userNamesWithOld)