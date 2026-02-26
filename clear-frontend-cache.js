// Run this in browser console to clear all SignalDesk caches
console.log('Clearing SignalDesk caches...');
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('intelligence') || key.includes('opportunity') || 
      key.includes('synthesis') || key.includes('organization'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});
console.log(`Cleared ${keysToRemove.length} cache entries`);
