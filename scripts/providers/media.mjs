// Stock media providers: search returns normalised results; resolve returns a download URL + credit.
// Endpoints contacted (only the providers you enable in studio.config.json -> media.providers):
//   openverse  GET https://api.openverse.org/v1/images/            (no key; CC0/BY/BY-SA only)
//   pexels     GET https://api.pexels.com/v1/search , /videos/search  (PEXELS_API_KEY)
//   pixabay    GET https://pixabay.com/api/ , /api/videos/            (PIXABAY_API_KEY)
//   wikimedia  GET https://commons.wikimedia.org/w/api.php          (no key; set media.wikimediaContact)
// Downloads come from each provider's CDN (live.staticflickr.com, images.pexels.com,
// videos.pexels.com, cdn.pixabay.com, upload.wikimedia.org).
import { http, requireKey } from "../lib.mjs";

const UA = (cfg) => ({ "user-agent": `IsoStudio/1.0 (documentary renderer${cfg.media?.wikimediaContact ? "; " + cfg.media.wikimediaContact : ""})` });
const OK_CC = ["by", "by-sa", "cc0", "pdm"];

const openverse = (cfg) => ({
  async search(q, n, type) {
    if (type === "video") return [];
    const u = new URL("https://api.openverse.org/v1/images/");
    u.searchParams.set("q", q);
    u.searchParams.set("page_size", String(n));
    u.searchParams.set("license_type", "commercial,modification");
    const d = await http(u, { headers: UA(cfg) });
    return d.results
      .filter((r) => OK_CC.includes(r.license))
      .map((r) => ({ id: `openverse:${r.id}`, type: "photo", w: r.width, h: r.height, license: `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim(), title: r.title, creator: r.creator, host: r.source }));
  },
  async resolve(id) {
    const r = await http(`https://api.openverse.org/v1/images/${id}/`, { headers: UA(cfg) });
    if (!OK_CC.includes(r.license)) throw new Error(`licence ${r.license} not allowed`);
    return {
      type: "photo",
      url: r.url,
      fallback: r.thumbnail,
      credit: { title: r.title, creator: r.creator, license: `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim(), license_url: r.license_url, source: r.foreign_landing_url },
    };
  },
});

const pexels = (cfg) => {
  const h = () => ({ authorization: requireKey("pexels", "Pexels"), ...UA(cfg) });
  return {
    async search(q, n, type) {
      if (type === "video") {
        const d = await http(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=${n}&orientation=portrait`, { headers: h() });
        return d.videos.map((v) => ({ id: `pexels:v${v.id}`, type: "video", w: v.width, h: v.height, dur: v.duration, license: "Pexels License", title: v.url.split("/").filter(Boolean).pop(), creator: v.user?.name, host: "pexels" }));
      }
      const d = await http(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${n}`, { headers: h() });
      return d.photos.map((p) => ({ id: `pexels:p${p.id}`, type: "photo", w: p.width, h: p.height, license: "Pexels License", title: p.alt || p.url, creator: p.photographer, host: "pexels" }));
    },
    async resolve(id) {
      if (id.startsWith("v")) {
        const v = await http(`https://api.pexels.com/videos/videos/${id.slice(1)}`, { headers: h() });
        const f = v.video_files.filter((x) => x.file_type === "video/mp4" && x.height >= 1080).sort((a, b) => a.height - b.height)[0] ?? v.video_files[0];
        return { type: "video", url: f.link, credit: { title: v.url, creator: v.user?.name, license: "Pexels License", license_url: "https://www.pexels.com/license/", source: v.url } };
      }
      const p = await http(`https://api.pexels.com/v1/photos/${id.slice(1)}`, { headers: h() });
      return { type: "photo", url: p.src.large2x ?? p.src.original, credit: { title: p.alt || p.url, creator: p.photographer, license: "Pexels License", license_url: "https://www.pexels.com/license/", source: p.url } };
    },
  };
};

const pixabay = (cfg) => {
  const key = () => requireKey("pixabay", "Pixabay");
  return {
    async search(q, n, type) {
      const base = type === "video" ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";
      const d = await http(`${base}?key=${key()}&q=${encodeURIComponent(q)}&per_page=${Math.max(3, n)}&safesearch=true${type === "video" ? "" : "&image_type=photo"}`, { headers: UA(cfg) });
      return d.hits.map((x) => ({
        id: `pixabay:${type === "video" ? "v" : "p"}${x.id}`,
        type: type === "video" ? "video" : "photo",
        w: x.imageWidth ?? x.videos?.large?.width,
        h: x.imageHeight ?? x.videos?.large?.height,
        dur: x.duration,
        license: "Pixabay Content License",
        title: x.tags,
        creator: x.user,
        host: "pixabay",
      }));
    },
    async resolve(id) {
      const isV = id.startsWith("v");
      const d = await http(`${isV ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/"}?key=${key()}&id=${id.slice(1)}`, { headers: UA(cfg) });
      const x = d.hits[0];
      const url = isV ? (x.videos.large?.url || x.videos.medium.url) : x.largeImageURL;
      return { type: isV ? "video" : "photo", url, credit: { title: x.tags, creator: x.user, license: "Pixabay Content License", license_url: "https://pixabay.com/service/license-summary/", source: x.pageURL } };
    },
  };
};

const wikimedia = (cfg) => ({
  async search(q, n, type) {
    if (type === "video") return [];
    if (!cfg.media?.wikimediaContact) console.warn("  tip: set media.wikimediaContact (e.g. a contact URL) — Wikimedia throttles anonymous clients");
    const u = new URL("https://commons.wikimedia.org/w/api.php");
    Object.entries({ action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrsearch: q, gsrlimit: String(n), prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "2000", iiextmetadatafilter: "LicenseShortName|Artist|ImageDescription" }).forEach(([k, v]) => u.searchParams.set(k, v));
    const d = await http(u, { headers: UA(cfg) });
    return Object.values(d.query?.pages ?? {})
      .map((p) => ({ p, ii: p.imageinfo?.[0] }))
      .filter(({ ii }) => ii && /^(CC0|CC BY(-SA)? [\d.]+|Public domain)/i.test(ii.extmetadata?.LicenseShortName?.value ?? ""))
      .map(({ p, ii }) => ({ id: `wikimedia:${p.pageid}`, type: "photo", w: ii.width, h: ii.height, license: ii.extmetadata.LicenseShortName.value, title: p.title.replace(/^File:/, ""), creator: (ii.extmetadata.Artist?.value ?? "").replace(/<[^>]+>/g, "").slice(0, 60), host: "wikimedia" }));
  },
  async resolve(id) {
    const u = new URL("https://commons.wikimedia.org/w/api.php");
    Object.entries({ action: "query", format: "json", pageids: id, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "2000", iiextmetadatafilter: "LicenseShortName|LicenseUrl|Artist" }).forEach(([k, v]) => u.searchParams.set(k, v));
    const d = await http(u, { headers: UA(cfg) });
    const p = d.query.pages[id];
    const ii = p.imageinfo[0];
    return {
      type: "photo",
      url: ii.thumburl ?? ii.url,
      credit: { title: p.title.replace(/^File:/, ""), creator: (ii.extmetadata.Artist?.value ?? "").replace(/<[^>]+>/g, ""), license: ii.extmetadata.LicenseShortName?.value, license_url: ii.extmetadata.LicenseUrl?.value, source: ii.descriptionurl },
    };
  },
});

const REGISTRY = { openverse, pexels, pixabay, wikimedia };
export const MEDIA_PROVIDERS = Object.keys(REGISTRY);
export const getMedia = (cfg, name) => {
  const f = REGISTRY[name];
  if (!f) throw new Error(`Unknown media provider "${name}" (${MEDIA_PROVIDERS.join(" | ")})`);
  return f(cfg);
};
export const UA_HEADERS = UA;
