/**
 * Victor Bona logo asset generator.
 *
 * Converts the green-background source logo into transparent master assets,
 * favicons, app icons, social cards, and utility background variants.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BRAND_NAME = "Victor Bona";
const TAGLINE = "Software / Systems / Operational Taste";
const SOURCE_FILE = "bona_logo_green_bg.png";
const SRC = path.resolve(__dirname, SOURCE_FILE);
const OUT_DIR = path.resolve(__dirname, "../public/logos");

const BRAND = {
  background: "#16100d",
  surface: "#221914",
  rule: "#5f5048",
  accent: "#c98263",
  foreground: "#efe7dc",
  muted: "#b5a69a",
  ink: "#080504",
  white: "#ffffff",
};

const FAVICON_SIZES = [16, 32, 48, 96, 180, 192, 512];

function distance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function averageColor(samples) {
  const totals = samples.reduce(
    (acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: Math.round(totals.r / samples.length),
    g: Math.round(totals.g / samples.length),
    b: Math.round(totals.b / samples.length),
  };
}

async function sampleKeyColor(inputPath) {
  const sampleSize = 24;
  const { width, height } = await sharp(inputPath).metadata();

  const regions = [
    { left: 0, top: 0 },
    { left: width - sampleSize, top: 0 },
    { left: 0, top: height - sampleSize },
    { left: width - sampleSize, top: height - sampleSize },
  ];

  const samples = [];
  for (const region of regions) {
    const { data } = await sharp(inputPath)
      .extract({ ...region, width: sampleSize, height: sampleSize })
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 3) {
      samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }

  return averageColor(samples);
}

async function chromaKey(inputPath) {
  const key = await sampleKeyColor(inputPath);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const innerDist = 58;
  const outerDist = 150;
  let transparentPixels = 0;
  let edgePixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const dist = distance(color, key);
    const greenDominant = color.g > color.r + 18 && color.g > color.b + 18;

    if (dist <= innerDist) {
      data[i + 3] = 0;
      transparentPixels++;
    } else if (greenDominant && dist < outerDist) {
      const alpha = Math.round(((dist - innerDist) / (outerDist - innerDist)) * 255);
      data[i + 3] = Math.max(0, Math.min(255, alpha));
      data[i + 1] = Math.min(color.g, Math.max(color.r, color.b) + 10);
      edgePixels++;
    } else if (greenDominant) {
      data[i + 1] = Math.min(color.g, Math.max(color.r, color.b) + 10);
      edgePixels++;
    }
  }

  return {
    key,
    transparentPixels,
    edgePixels,
    image: sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }),
  };
}

async function metadataFor(bufferOrPath) {
  const metadata = await sharp(bufferOrPath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hasAlpha: Boolean(metadata.hasAlpha),
  };
}

async function alphaStats(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  let opaque = 0;
  let partial = 0;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) transparent++;
    else if (data[i] === 255) opaque++;
    else partial++;
  }

  const pixels = info.width * info.height;
  return {
    transparent,
    opaque,
    partial,
    transparentRatio: Number((transparent / pixels).toFixed(4)),
    partialRatio: Number((partial / pixels).toFixed(4)),
  };
}

async function suppressGreenSpill(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] > 0 && g > r + 18 && g > b + 18) {
      data[i + 1] = Math.min(g, Math.max(r, b) + 10);
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function greenFringeStats(input) {
  const { data } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let suspicious = 0;
  let visible = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a > 20) {
      visible++;
      if (g > r + 30 && g > b + 30) {
        suspicious++;
      }
    }
  }

  return { suspicious, visible };
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

async function colorizeVisible(input, colorHex) {
  const color = hexToRgb(colorHex);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function extractMonogram(transparentLogo) {
  const meta = await sharp(transparentLogo).metadata();
  const cropHeight = Math.round(meta.height * 0.68);
  return sharp(transparentLogo)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .trim({ threshold: 4 })
    .png()
    .toBuffer();
}

function escapeXml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function svgText({ width, height, text, x = width / 2, y, size, weight = 700, fill = BRAND.foreground, opacity = 1 }) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="${x}" y="${y}" text-anchor="middle"
      font-family="Atkinson Hyperlegible, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      font-size="${size}" font-weight="${weight}"
      letter-spacing="0"
      fill="${fill}" opacity="${opacity}">${escapeXml(text)}</text>
  </svg>`);
}

function iconBackgroundSvg(size) {
  const inset = Math.round(size * 0.08);

  return Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BRAND.background}"/>
    <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" fill="none" stroke="${BRAND.rule}" stroke-width="${Math.max(1, Math.round(size * 0.008))}"/>
    <rect x="${inset * 1.5}" y="${inset * 1.5}" width="${size - inset * 3}" height="${size - inset * 3}" fill="${BRAND.surface}" opacity="0.48"/>
  </svg>`);
}

function ogBackgroundSvg(width, height) {
  const verticalLines = Array.from({ length: Math.ceil(width / 80) + 1 }, (_, index) => {
    const x = index * 80;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${BRAND.rule}" stroke-opacity="0.22"/>`;
  }).join("");

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${BRAND.background}"/>
    ${verticalLines}
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="${BRAND.rule}" stroke-opacity="0.78" stroke-width="1"/>
    <line x1="48" y1="468" x2="${width - 48}" y2="468" stroke="${BRAND.rule}" stroke-opacity="0.72"/>
    <text x="72" y="92" font-family="Atkinson Hyperlegible, Inter, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="${BRAND.accent}">[VICTOR BONA]</text>
  </svg>`);
}

async function writePng(name, input) {
  const outputPath = path.join(OUT_DIR, name);
  const sanitized = await suppressGreenSpill(input);
  await sharp(sanitized).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outputPath);
  return { name, path: outputPath, ...(await metadataFor(outputPath)) };
}

async function createLogoOnBackground(name, transparentLogo, background) {
  const size = 1024;
  const logo = await sharp(transparentLogo)
    .resize(Math.round(size * 0.76), Math.round(size * 0.76), { fit: "inside" })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  return writePng(
    name,
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background,
      },
    })
      .composite([
        {
          input: logo,
          left: Math.round((size - logoMeta.width) / 2),
          top: Math.round((size - logoMeta.height) / 2),
        },
      ])
      .png()
      .toBuffer(),
  );
}

async function createIcon(name, monogram, size, branded = false) {
  const logoSize = branded ? Math.round(size * 0.68) : size;
  const resizedLogo = await sharp(monogram)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (!branded) {
    return writePng(name, resizedLogo);
  }

  const logoMeta = await sharp(resizedLogo).metadata();
  const background = await sharp(iconBackgroundSvg(size)).png().toBuffer();
  return writePng(
    name,
    await sharp(background)
      .composite([
        {
          input: resizedLogo,
          left: Math.round((size - logoMeta.width) / 2),
          top: Math.round((size - logoMeta.height) / 2),
        },
      ])
      .png()
      .toBuffer(),
  );
}

async function validateGeneratedAssets(assets, logoBuffer, sourceMeta, chromaStats) {
  const logoStats = await alphaStats(logoBuffer);
  const byName = new Map(assets.map((asset) => [asset.name, asset]));

  const requiredDimensions = {
    "favicon-16.png": [16, 16],
    "favicon-32.png": [32, 32],
    "favicon-48.png": [48, 48],
    "favicon-96.png": [96, 96],
    "apple-touch-icon.png": [180, 180],
    "icon-192.png": [192, 192],
    "icon-512.png": [512, 512],
    "icon-branded-512.png": [512, 512],
    "og-image.png": [1200, 630],
    "logo-on-white.png": [1024, 1024],
    "logo-on-dark.png": [1024, 1024],
  };

  for (const [name, [width, height]] of Object.entries(requiredDimensions)) {
    const asset = byName.get(name);
    if (!asset) {
      throw new Error(`Missing generated asset: ${name}`);
    }
    if (asset.width !== width || asset.height !== height) {
      throw new Error(`${name} is ${asset.width}x${asset.height}, expected ${width}x${height}`);
    }
  }

  if (sourceMeta.width !== sourceMeta.height) {
    throw new Error(`Source logo must be square, got ${sourceMeta.width}x${sourceMeta.height}`);
  }
  if (chromaStats.transparentPixels < sourceMeta.width * sourceMeta.height * 0.15) {
    throw new Error("Chroma-key removed too few pixels; source green may not have been extracted.");
  }
  if (logoStats.transparentRatio < 0.2) {
    throw new Error(`Transparent logo has too little transparency: ${logoStats.transparentRatio}`);
  }

  for (const name of ["logo-transparent.png", "monogram-transparent.png", "icon-512.png", "og-image.png"]) {
    const stats = await greenFringeStats(byName.get(name).path);
    if (stats.suspicious > 0) {
      throw new Error(`${name} has ${stats.suspicious} visible green-fringe pixels`);
    }
  }

  return { logoStats };
}

async function main() {
  console.log(`${BRAND_NAME} logo generator\n`);
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const sourceMeta = await metadataFor(SRC);
  console.log(`1. Reading ${SOURCE_FILE} (${sourceMeta.width}x${sourceMeta.height})`);

  console.log("2. Removing green-screen background...");
  const keyed = await chromaKey(SRC);
  const transparentSourceBuffer = await keyed.image.png().toBuffer();
  console.log(
    `   key rgb(${keyed.key.r}, ${keyed.key.g}, ${keyed.key.b}); removed ${keyed.transparentPixels.toLocaleString()} pixels`,
  );

  const logoBuffer = await sharp(transparentSourceBuffer).trim({ threshold: 8 }).png().toBuffer();
  const monogramBuffer = await extractMonogram(logoBuffer);
  const squareLogoBuffer = await sharp(logoBuffer)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const squareMonogramBuffer = await sharp(monogramBuffer)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const lightSquareLogoBuffer = await colorizeVisible(squareLogoBuffer, BRAND.foreground);
  const lightSquareMonogramBuffer = await colorizeVisible(squareMonogramBuffer, BRAND.foreground);

  console.log("3. Writing transparent source assets...");
  const assets = [];
  assets.push(await writePng("logo-transparent.png", logoBuffer));
  assets.push(await writePng("logo-square-transparent.png", squareLogoBuffer));
  assets.push(await writePng("monogram-transparent.png", monogramBuffer));
  assets.push(await writePng("monogram-square-transparent.png", squareMonogramBuffer));

  console.log("4. Writing favicons and app icons...");
  for (const size of FAVICON_SIZES) {
    const fileName = size === 180 ? "apple-touch-icon.png" : size >= 192 ? `icon-${size}.png` : `favicon-${size}.png`;
    assets.push(await createIcon(fileName, lightSquareMonogramBuffer, size, true));
  }

  console.log("5. Writing branded app icons...");
  for (const size of [180, 192, 512]) {
    const name = size === 180 ? "apple-touch-icon-branded.png" : `icon-branded-${size}.png`;
    assets.push(await createIcon(name, lightSquareMonogramBuffer, size, true));
  }

  console.log("6. Writing social and utility variants...");
  const ogWidth = 1200;
  const ogHeight = 630;
  const ogIcon = await sharp(lightSquareMonogramBuffer).resize(300, 300, { fit: "contain" }).png().toBuffer();
  const ogIconMeta = await sharp(ogIcon).metadata();
  const og = await sharp(ogBackgroundSvg(ogWidth, ogHeight))
    .composite([
      { input: ogIcon, left: Math.round((ogWidth - ogIconMeta.width) / 2), top: 122 },
      { input: svgText({ width: ogWidth, height: 72, text: BRAND_NAME, y: 52, size: 54 }), left: 0, top: 486 },
      {
        input: svgText({ width: ogWidth, height: 36, text: TAGLINE, y: 24, size: 20, weight: 500, fill: BRAND.muted }),
        left: 0,
        top: 550,
      },
    ])
    .png()
    .toBuffer();
  assets.push(await writePng("og-image.png", og));
  assets.push(await createLogoOnBackground("logo-on-white.png", squareLogoBuffer, { r: 255, g: 255, b: 255, alpha: 255 }));
  assets.push(await createLogoOnBackground("logo-on-dark.png", lightSquareLogoBuffer, { r: 22, g: 16, b: 13, alpha: 255 }));

  const manifest = {
    name: BRAND_NAME,
    short_name: "Victor Bona",
    description: TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.background,
    theme_color: BRAND.background,
    icons: [
      { src: "/logos/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logos/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/logos/icon-branded-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  await writeFile(path.join(OUT_DIR, "site.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);
  assets.push({ name: "site.webmanifest", path: path.join(OUT_DIR, "site.webmanifest"), format: "json" });

  console.log("7. Validating generated assets...");
  const validation = await validateGeneratedAssets(assets, logoBuffer, sourceMeta, keyed);
  const assetManifest = {
    brandName: BRAND_NAME,
    tagline: TAGLINE,
    source: SOURCE_FILE,
    sourceMetadata: sourceMeta,
    chromaKey: {
      sampledKey: keyed.key,
      transparentPixels: keyed.transparentPixels,
      edgePixels: keyed.edgePixels,
    },
    validation,
    assets: assets.map(({ name, width, height, format, hasAlpha }) => ({ name, width, height, format, hasAlpha })),
  };
  await writeFile(path.join(OUT_DIR, "asset-manifest.json"), `${JSON.stringify(assetManifest, null, 2)}\n`);
  assets.push({ name: "asset-manifest.json", path: path.join(OUT_DIR, "asset-manifest.json"), format: "json" });

  for (const asset of assets) {
    if (asset.width && asset.height) {
      console.log(`   -> ${asset.name} (${asset.width}x${asset.height})`);
    } else {
      console.log(`   -> ${asset.name}`);
    }
  }

  console.log("\nGeneration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
