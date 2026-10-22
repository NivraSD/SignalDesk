import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Kill any rogue service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}

// Home-screen apps keep running the version they launched with until iOS kills them, so a deploy
// can go unnoticed for hours. When the app comes back to the foreground, check whether a newer
// build is live and reload into it. Only on return to the app, never mid-typing.
const currentBundle = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src
async function reloadIfUpdated() {
  if (!currentBundle) return // dev server: no hashed bundle
  try {
    const html = await (await fetch(`/?v=${Date.now()}`, { cache: 'no-store' })).text()
    const live = html.match(/src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1]
    if (live && !currentBundle.endsWith(live)) window.location.reload()
  } catch {
    // offline or flaky network: keep running the current version
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reloadIfUpdated()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
