// The background service worker is the SINGLE WRITER (see 03 §5.1): all bookmark mutations
// and StorageRoot writes go through here so the task lock and writes are effectively atomic.
// v0.1 skeleton: just confirm the worker boots.
export default defineBackground(() => {
  console.log('Corvus Mark background ready')
})
