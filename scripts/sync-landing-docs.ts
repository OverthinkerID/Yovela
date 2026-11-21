import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
// @ts-expect-error @types/react-dom is not installed in devDependencies
import { renderToStaticMarkup } from 'react-dom/server';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import LandingPage from '../src/app/page';
import { ToastProvider } from '../src/context/ToastContext';
import { LANDING_CONFIG } from '../src/config/landingConfig';

const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const DOCS_ASSETS_DIR = path.join(DOCS_DIR, 'assets');
const DOCS_IMAGES_DIR = path.join(DOCS_DIR, 'images');
const PUBLIC_IMAGES_DIR = path.join(ROOT_DIR, 'public', 'images');
const GLOBALS_CSS_PATH = path.join(ROOT_DIR, 'src', 'app', 'globals.css');

const VALIDATE_ONLY = process.argv.includes('--validate');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function syncImages(): string[] {
  ensureDir(DOCS_IMAGES_DIR);
  const copiedFiles: string[] = [];

  if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
    return copiedFiles;
  }

  const publicEntries = fs.readdirSync(PUBLIC_IMAGES_DIR, { withFileTypes: true });
  const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.avif', '.gif']);

  const activeNames = new Set<string>();
  for (const entry of publicEntries) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!allowedExts.has(ext)) continue;

    activeNames.add(entry.name);
    fs.copyFileSync(path.join(PUBLIC_IMAGES_DIR, entry.name), path.join(DOCS_IMAGES_DIR, entry.name));
    copiedFiles.push(entry.name);
  }

  for (const existing of fs.readdirSync(DOCS_IMAGES_DIR, { withFileTypes: true })) {
    if (existing.isFile() && !activeNames.has(existing.name)) {
      fs.unlinkSync(path.join(DOCS_IMAGES_DIR, existing.name));
    }
  }

  return copiedFiles;
}

async function compileLandingCss(): Promise<string> {
  const cssSource = fs.readFileSync(GLOBALS_CSS_PATH, 'utf8');
  const result = await postcss([tailwindcss()]).process(cssSource, {
    from: GLOBALS_CSS_PATH,
  });
  return result.css;
}

function validateDocsOutput(): void {
  const errors: string[] = [];
  const indexHtmlPath = path.join(DOCS_DIR, 'index.html');
  const cssPath = path.join(DOCS_ASSETS_DIR, 'landing.css');
  const jsPath = path.join(DOCS_ASSETS_DIR, 'landing-runtime.js');
  const guidePath = path.join(DOCS_DIR, 'PANDUAN_DATABASE_DAN_VERCEL.md');

  if (!fs.existsSync(indexHtmlPath)) errors.push('docs/index.html tidak ditemukan.');
  if (!fs.existsSync(cssPath)) errors.push('docs/assets/landing.css tidak ditemukan.');
  if (!fs.existsSync(jsPath)) errors.push('docs/assets/landing-runtime.js tidak ditemukan.');
  if (!fs.existsSync(guidePath)) errors.push('docs/PANDUAN_DATABASE_DAN_VERCEL.md hilang (tidak boleh terhapus).');

  if (fs.existsSync(indexHtmlPath)) {
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    if (html.length < 5000) errors.push('docs/index.html terlalu kecil / kosong.');
    if (html.includes('src="/images/')) errors.push('Ditemukan path absolut src="/images/" yang belum diubah menjadi ./images/.');
    if (!html.includes('Poppins')) errors.push('Font Poppins belum tercantum di metadata head.');

    const requiredIds = ['id="home"', 'id="about"', 'id="treatments"', 'id="dentist"', 'id="gallery"', 'id="appointment"', 'id="contact"'];
    for (const reqId of requiredIds) {
      if (!html.includes(reqId)) errors.push(`Section ${reqId} tidak ditemukan di docs/index.html.`);
    }

    const imgMatches = [...html.matchAll(/src="(\.\/images\/[^"]+)"/g)];
    for (const m of imgMatches) {
      const rel = m[1].replace(/^\.\//, '');
      const fullImg = path.join(DOCS_DIR, rel);
      if (!fs.existsSync(fullImg)) {
        errors.push(`Broken image asset: ${m[1]} tidak ditemukan di ${fullImg}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ Validasi docs/ gagal:\n - ' + errors.join('\n - '));
    process.exit(1);
  }

  console.log('✅ Validasi docs/ sukses: index.html, landing.css, landing-runtime.js, font Poppins, dan seluruh aset gambar valid.');
}

function buildHtmlDocument(): string {
  const clientConfig = {
    brandName: LANDING_CONFIG.brand.name,
    navLinks: LANDING_CONFIG.navLinks,
    treatments: LANDING_CONFIG.treatments,
    testimonials: LANDING_CONFIG.testimonials,
    appointmentCta: LANDING_CONFIG.appointmentCta,
  };

  let fontHref = '';
  const existingHtmlPath = path.join(DOCS_DIR, 'index.html');
  if (fs.existsSync(existingHtmlPath)) {
    const existingHtml = fs.readFileSync(existingHtmlPath, 'utf8');
    const match = existingHtml.match(/href="([^"]*css2\?[^"]+)"/);
    if (match) {
      fontHref = match[1].includes('Poppins')
        ? match[1]
        : match[1].replace('&display=swap', '&family=Poppins:wght@400;500;600;700;800;900&display=swap');
    }
  }

  const headEl = React.createElement(
    'head',
    null,
    React.createElement('meta', { charSet: 'UTF-8' }),
    React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
    React.createElement('title', null, 'Yovela Dental Clinic — Klinik Gigi Modern & SIM-RME'),
    React.createElement('meta', {
      name: 'description',
      content: 'Klinik Gigi Modern dengan pendekatan tenang, transparan, dan berbasis Rekam Medis Elektronik serta Odontogram Digital standar FDI.',
    }),
    React.createElement('meta', { name: 'theme-color', content: '#234B38' }),
    fontHref ? React.createElement('link', { rel: 'stylesheet', href: fontHref }) : null,
    React.createElement('style', null, ":root{--font-poppins:'Poppins',ui-sans-serif,system-ui,sans-serif;}"),
    React.createElement('link', { rel: 'stylesheet', href: './assets/landing.css' })
  );

  const bodyEl = React.createElement(
    'body',
    {
      className: 'bg-[#F3EBDD] text-[#234B38] font-sans antialiased m-0 p-0',
      'data-landing-config': JSON.stringify(clientConfig),
    },
    React.createElement(ToastProvider, null, React.createElement(LandingPage)),
    React.createElement('script', { src: './assets/landing-runtime.js', defer: true })
  );

  const htmlMarkup = renderToStaticMarkup(
    React.createElement('html', { lang: 'id' }, headEl, bodyEl)
  ).replace(/src="\/images\//g, 'src="./images/');

  return `<!DOCTYPE html>\n${htmlMarkup}\n`;
}

async function main() {
  if (VALIDATE_ONLY) {
    validateDocsOutput();
    return;
  }

  ensureDir(DOCS_DIR);
  ensureDir(DOCS_ASSETS_DIR);

  const copiedImages = syncImages();
  const compiledCss = await compileLandingCss();
  const fullHtml = buildHtmlDocument();

  fs.writeFileSync(path.join(DOCS_ASSETS_DIR, 'landing.css'), compiledCss, 'utf8');
  fs.copyFileSync(path.join(ROOT_DIR, 'scripts', 'landing-runtime.js'), path.join(DOCS_ASSETS_DIR, 'landing-runtime.js'));
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), fullHtml, 'utf8');

  console.log(`✅ Sinkronisasi TSX -> docs/ selesai (${copiedImages.length} aset gambar disalin).`);
  validateDocsOutput();
}

main().catch((err) => {
  console.error('❌ Gagal menjalankan sync-landing-docs:', err);
  process.exit(1);
});

