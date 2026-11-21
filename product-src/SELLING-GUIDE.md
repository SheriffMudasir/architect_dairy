# Selling guide — Gumroad and Agensi

One package serves both: `dist/isometric-explainer-studio-v1.1.0.zip` (build with
`node tools/build-product.mjs`). It is text-only (fonts come from npm), every file is under 20 KB,
68 files / ~216k characters, no node_modules/.git, and the build fails if personal data or keys leak.

## Before listing anywhere (once)
1. Test each provider you advertise with real keys in a fresh project:
   ElevenLabs (voice + music + speech-to-text), OpenAI, Pexels, Pixabay. (Gemini, Lyria, Openverse,
   own-audio and video inserts are already tested end to end.)
2. Prepare demo media: `out/ep01.mp4`, `out/ep02.mp4` (cover video), a 30–60 s screen recording of the
   onboarding interview → doctor → render, and 3–5 still frames (cover images, 1280×720 or 1:1).
3. Decide price: launch $29, then $39 one-time (or $12/month with updates on Agensi).

## Gumroad (buyer downloads the zip)
1. gumroad.com → New product → **Digital product**.
2. Name: "Isometric Explainer Studio — AI agent skill for architecture & history Shorts".
3. Price: $29 (tick "Allow customers to pay more" if you like). Optional: discount code for launch.
4. Description: paste from `LISTING.md` (description + requirements + "Bring your own tools").
   Add: *"After purchase: unzip and follow INSTALL.md (Claude Code: put the folder in
   ~/.claude/skills/)."* Embed the ep01/ep02 videos (YouTube/Vimeo link) and the screen recording.
5. **Content** tab → upload `isometric-explainer-studio-v1.1.0.zip`.
6. Settings: enable **license keys** only if you want to track buyers (not needed to function);
   set the refund policy; add "Updates included" in the summary.
7. Publish → share the link in your Reels/Shorts captions and bio.
8. Updates: rebuild, bump `VERSION` in `tools/build-product.mjs` and `version:` in `product-src/SKILL.md`,
   replace the file on the Content tab, and use **Workflows/Emails → Update** to notify buyers.

Notes: Gumroad charges a percentage + fixed fee per sale (check their current pricing); they act as
merchant of record for sales tax/VAT in most regions — confirm on their pricing/tax pages.

## Agensi (skill streams into the buyer's agent)
1. Sign up → Creator dashboard → **Settings → Payouts**: connect **Zoneless** (USDC on Solana; Stripe
   Connect isn't available in Nigeria) and complete KYC — required before a paid skill can go live.
2. **Submit a Skill** → upload `isometric-explainer-studio-v1.1.0.zip`. The form reads the
   `SKILL.md` frontmatter (`name`, `description`, `summary`, `version`, `tags`, `keywords`, `use_cases`).
3. Pricing: one-time $29 launch → $39, or subscription $12/month (updates are pushed automatically
   to every buyer's agent).
4. Listing extras: cover images, demo video links, and in the description stress **"works with Agensi
   tools — no API keys needed"** (ElevenLabs TTS / MiniMax Speech / Lyria via your Agensi balance) plus
   bring-your-own-keys for ElevenLabs, Gemini, OpenAI, Pexels, Pixabay.
5. Optional: in the submission's tools section, attach the Agensi tools the skill can use (ElevenLabs
   Text to Speech, Google Lyria 3.5, ElevenLabs Music) so buyers' agents see them.
6. Review takes ~24–48 h (automated 8-point scan + AI + human). The package already:
   documents every network endpoint (SKILL.md §3), keeps keys in `.env` only, has no global installs,
   no edits outside the project folder, no binaries, no bundled dependencies.
7. Updates: rebuild and upload a new version from the dashboard; buyers' agents get it on next use.

How delivery works there: the buyer's agent reads SKILL.md and the template files in memory. SKILL.md
tells it to write the template into the buyer's working folder using `reference/template-manifest.md`
(the scaffold is the *output*; the skill itself is never saved). This mode was tested: a project
rebuilt purely from the manifest is byte-identical to the Gumroad `init-project` result and renders.

## Other stores
Lemon Squeezy, Payhip, Etsy (digital), your own site: same zip + INSTALL.md, same description.
Keep prices consistent across stores.
