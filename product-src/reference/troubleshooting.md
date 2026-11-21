# Troubleshooting

| Symptom | Fix |
|---|---|
| `… needs XXX_API_KEY` | Add it to `.env` (copy `.env.example`). Never paste keys into chat. `npm run doctor` |
| doctor: API answered 401/403 | Wrong key, or the key lacks that permission (ElevenLabs keys have per-feature permissions) |
| `fetch failed` / `ENOTFOUND` / `getaddrinfo` | Network blocks the host. Always run scripts via `npm run` (enables `NODE_USE_ENV_PROXY=1` for proxied environments). In sandboxes, allow the provider's host |
| Remotion can't download Chrome | Set `REMOTION_BROWSER=/path/to/chrome-headless-shell` (or any Chrome/Chromium) in `.env` |
| Fonts missing / render waits on fonts | Fonts are bundled in `public/fonts`; don't switch to remote Google Fonts in locked-down networks |
| Narration contains extra spoken words | Something non-spoken is in a beat's `text`; remove it, `npm run voice -- <ep> <beat> ` |
| Captions run early/late | Check `public/<ep>/timeline.json` for non-monotonic `startMs`; for perfect sync use ElevenLabs (timestamps) |
| Beat timings ignored (silent video) | Beat ids changed after voicing → re-run `npm run voice -- <ep>` |
| Music too long/short | Music is trimmed and faded to the episode; regenerate after any voice change |
| Wikimedia 429 / blocked | Set `media.wikimediaContact`; shared IPs may be throttled — use Openverse (it indexes Wikimedia too) |
| Pexels can't issue a key | Use Pixabay or Openverse |
| Image downloads blocked but search works | The image CDN host isn't allowed (e.g. `live.staticflickr.com`); allow it or pick another result |
| Object hidden behind buildings | Painter's order — remove the occluding row for that beat or change camera yaw |
| Render slow | `npm run render` uses 4 threads; close other apps or render at lower `--scale` for previews |
