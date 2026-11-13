// Reads data/airbnb-experiences.csv, downloads each listing's own photos
// (main + up to 4 more), and writes src/data/airbnbExperiences.generated.ts.
// Photos are stored in the repo. Nothing is hotlinked.
//
//   node --experimental-strip-types scripts/build-airbnb-experiences.mjs

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  businessDisplayName,
  inferExperienceCategory,
  personName,
} from "../src/lib/experienceCategory.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(root, "data/airbnb-experiences.csv");
const photoRoot = join(root, "public/experience-photos");
const outPath = join(root, "src/data/airbnbExperiences.generated.ts");
const cachePath = join(root, "data/.airbnb-photo-cache.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

function experienceIdFromUrl(url) {
  const match = String(url).match(/experiences\/(\d+)/);
  if (!match) throw new Error(`No experience id in ${url}`);
  return match[1];
}

function listingPhotos(html, experienceId) {
  const pattern = new RegExp(
    `https://a0\\.muscache\\.com/im/pictures/(?:lombard/MtTemplate-${experienceId}-active_media|Mt/MtTemplate-${experienceId})/original/[a-z0-9-]+\\.(?:jpe?g|png|webp)`,
    "gi",
  );
  const ordered = [];
  const seen = new Set();
  const push = (url) => {
    if (!url) return;
    const clean = url.split("?")[0];
    if (!clean.includes(experienceId) || seen.has(clean)) return;
    seen.add(clean);
    ordered.push(clean);
  };
  const og = html.match(/property="og:image" content="([^"]+)"/);
  if (og) push(og[1]);
  for (const url of html.match(pattern) || []) push(url);
  return ordered.slice(0, 5);
}

async function fetchText(url, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  if ((response.status !== 200 || text.length < 8000) && attempt < 3) {
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return fetchText(url, attempt + 1);
  }
  return text;
}

function fileOk(path) {
  try {
    return statSync(path).size > 4000;
  } catch {
    return false;
  }
}

function runFfmpeg(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      input,
      "-vf",
      "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease",
      "-q:v",
      "8",
      output,
    ]);
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk;
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg ${code}`))));
  });
}

async function downloadPhoto(remote, dest) {
  if (fileOk(dest)) return true;
  mkdirSync(dirname(dest), { recursive: true });
  const response = await fetch(`${remote}${remote.includes("?") ? "&" : "?"}im_w=1200`, {
    headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) return false;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 4000) return false;
  const temp = `${dest}.src`;
  writeFileSync(temp, bytes);
  try {
    await runFfmpeg(temp, dest);
  } finally {
    try {
      statSync(temp);
      const { unlinkSync } = await import("node:fs");
      unlinkSync(temp);
    } catch {
      /* already gone */
    }
  }
  return fileOk(dest);
}

async function pool(items, limit, worker) {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

function loadCache() {
  try {
    return JSON.parse(readFileSync(cachePath, "utf8"));
  } catch {
    return {};
  }
}

const table = parseCsv(readFileSync(csvPath, "utf8"));
const header = table[0];
if (header[0] !== "vendor_name" || header[6] !== "is_top") {
  throw new Error(`Unexpected CSV header: ${header.join(",")}`);
}

const rows = table.slice(1).map((cells) => {
  const [vendorName, username, title, rating, reviews, sourceUrl, isTop] = cells;
  const experienceId = experienceIdFromUrl(sourceUrl);
  return {
    id: `airbnb-${experienceId}`,
    experienceId,
    username: username.trim(),
    vendorName: vendorName.trim(),
    title: title.trim(),
    rating: rating.trim() ? Number(rating) : null,
    reviewCount: reviews.trim() ? Number(reviews) : null,
    sourceUrl: sourceUrl.trim(),
    isTop: isTop.trim().toLowerCase() === "yes",
  };
});

const cache = loadCache();
let fetchedPages = 0;
let failedPages = 0;

await pool(rows, 5, async (row) => {
  const cached = cache[row.id];
  const cachedPhotos = Array.isArray(cached?.remote) ? cached.remote : null;
  const localsReady =
    cachedPhotos &&
    cachedPhotos.every((_, index) =>
      fileOk(join(photoRoot, row.username, `${row.experienceId}-${index + 1}.jpg`)),
    );
  if (localsReady) {
    row.remote = cachedPhotos;
    return;
  }
  try {
    const html = await fetchText(row.sourceUrl);
    row.remote = listingPhotos(html, row.experienceId);
    if (!row.remote.length) failedPages += 1;
  } catch (error) {
    row.remote = [];
    failedPages += 1;
    console.error(`page ${row.experienceId}: ${error.message}`);
  }
  fetchedPages += 1;
  if (fetchedPages % 20 === 0) console.log(`fetched ${fetchedPages} listing pages`);
});

const downloads = [];
for (const row of rows) {
  row.photos = [];
  (row.remote || []).forEach((remote, index) => {
    const filename = `${row.experienceId}-${index + 1}.jpg`;
    const dest = join(photoRoot, row.username, filename);
    const publicPath = `/experience-photos/${row.username}/${filename}`;
    downloads.push({ remote, dest, publicPath, row });
  });
}

let saved = 0;
let missed = 0;
await pool(downloads, 6, async (job) => {
  try {
    const ok = await downloadPhoto(job.remote, job.dest);
    if (ok) {
      job.row.photos.push(job.publicPath);
      saved += 1;
    } else missed += 1;
  } catch (error) {
    missed += 1;
    console.error(`photo ${job.publicPath}: ${error.message}`);
  }
});

for (const row of rows) {
  row.photos.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const cacheOut = {};
for (const row of rows) {
  cacheOut[row.id] = { remote: row.remote || [] };
}
writeFileSync(cachePath, JSON.stringify(cacheOut));

const experiences = rows.map((row) => ({
  id: row.id,
  username: row.username,
  title: row.title,
  businessName: businessDisplayName(row.vendorName),
  personName: personName(row.vendorName),
  category: inferExperienceCategory(row.title),
  rating: Number.isFinite(row.rating) ? row.rating : null,
  reviewCount: Number.isFinite(row.reviewCount) ? row.reviewCount : null,
  isTop: row.isTop,
  photos: row.photos,
}));

const body = experiences
  .map((item) => `  ${JSON.stringify(item)}`)
  .join(",\n");

writeFileSync(
  outPath,
  `// Generated by scripts/build-airbnb-experiences.mjs from data/airbnb-experiences.csv.
// Listing URLs stay in data/airbnb-experiences.csv. Do not copy them here.
// Photos are local files. Do not hotlink.

export type AirbnbExperience = {
  id: string;
  username: string;
  title: string;
  businessName: string;
  personName: string | null;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  isTop: boolean;
  photos: string[];
};

export const airbnbExperiences: AirbnbExperience[] = [
${body},
];
`,
);

const withPhotos = experiences.filter((item) => item.photos.length).length;
console.log(
  `wrote ${experiences.length} experiences, ${withPhotos} with photos, ${saved} files, ${missed} photo misses, ${failedPages} page misses`,
);
