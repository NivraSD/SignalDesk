// Server-side text compositing is disabled — Vercel Lambda has no reliable
// text rendering (Sharp SVG = tiny dots, @napi-rs/canvas = build failures,
// embedded fonts = replacement squares).
//
// Text overlay is handled by iOS Shortcuts' native "Overlay Text on Image" action
// which renders fonts correctly using the device's own font system.
//
// The wallpaper endpoint returns the raw image + title separately.
// Shortcut: get title → get image → overlay text → set wallpaper.

export {}
