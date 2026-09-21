#!/usr/bin/env node
/**
 * build-thumbnails.mjs — Generate furniture thumbnails from GLB models at build time.
 *
 * Uses Three.js + node-canvas to render each catalog asset's GLB into a PNG
 * thumbnail. Applies the SAME normalization as the runtime model-loader.
 *
 * Usage:
 *   node build-thumbnails.mjs              # generate all missing thumbnails
 *   node build-thumbnails.mjs --force     # regenerate all
 *   node build-thumbnails.mjs --asset a000_base_2_doors_60x46x50   # single asset
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, 'bathroom-configurator/app');
const PUBLIC_DIR = path.join(APP_DIR, 'public');
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'furniture.json');
const THUMB_DIR = path.join(PUBLIC_DIR, 'assets/thumbnails');
const THUMB_WIDTH = 240;
const THUMB_HEIGHT = 180;

// ── CLI ──
const args = process.argv.slice(2);
const singleAsset = args.find((a) => a.startsWith('--asset='))?.split('=')[1] || null;
const force = args.includes('--force');

// ── Ensure output directory ──
fs.mkdirSync(THUMB_DIR, { recursive: true });

// ── Load manifest ──
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`ERROR: ${MANIFEST_PATH} not found. Run build-assets-manifest.js first.`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const assets = manifest.assets || [];
console.log(`Loaded ${assets.length} assets from furniture.json`);

// ── Filter assets to process ──
const assetsToProcess = assets.filter((a) => {
  if (!a.model) return false;
  if (a.model.startsWith('builtin://')) return false;
  if (!a.model.endsWith('.glb')) return false;
  if (!a.hasDimensions) return false;
  if (singleAsset && a.id !== singleAsset) return false;
  const thumbPath = path.join(THUMB_DIR, `${a.id}.png`);
  if (!force && fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 0) return false;
  return true;
});

console.log(`Processing ${assetsToProcess.length} assets (force=${force}${singleAsset ? ', single=' + singleAsset : ''})`);

if (assetsToProcess.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

// ── Resolve GLB path from manifest path ──
function resolveGlbPath(manifestModelPath) {
  let rel = manifestModelPath;
  if (rel.startsWith('/')) rel = rel.slice(1);

  const candidates = [
    path.join(PUBLIC_DIR, rel),
    path.join(APP_DIR, rel),
    path.join(__dirname, rel),
    path.join(__dirname, 'bathroom-configurator', 'assets', rel),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ── Main ──
(async () => {
  // Import Three.js from the app's node_modules (package is type: "module")
  const THREE = (await import(path.join(APP_DIR, 'node_modules/three/dist/three.module.js'))).default;
  const GLTFLoaderMod = await import(path.join(APP_DIR, 'node_modules/three/addons/loaders/GLTFLoader.js'));
  const GLTFLoader = GLTFLoaderMod.default;

  // ── Build normalization lookup (mirrors normalization.ts) ──
  const L60_ROTATION = [-Math.PI / 2, Math.PI, 0];
  const L60_AXIS_MAP = { width: 'x', depth: 'z', height: 'y' };
  const QUATTRO_COLUMN_ROTATION = [-Math.PI / 2, 0, 0];
  const QUATTRO_COLUMN_AXIS_MAP = { width: 'x', depth: 'y', height: 'z' };
  const IDENTITY = { scale: 1, rotation: [0, 0, 0], axisMap: { width: 'x', depth: 'z', height: 'y' } };

  function getNormalization(asset) {
    if (asset.manufacturer === 'L60') {
      return { scale: 1, rotation: L60_ROTATION, axisMap: L60_AXIS_MAP };
    }
    if (asset.manufacturer === 'QUATTRO.ZERO') {
      const lower = (asset.name || '').toLowerCase();
      if (lower.startsWith('column')) {
        return { scale: 1, rotation: QUATTRO_COLUMN_ROTATION, axisMap: QUATTRO_COLUMN_AXIS_MAP };
      }
      return IDENTITY;
    }
    if (asset.manufacturer === 'VIAVENETO') {
      return { scale: 1, rotation: [0, 0, 0], axisMap: { width: 'x', depth: 'y', height: 'z' } };
    }
    return IDENTITY;
  }

  // ── Renderer setup ──
  const canvas = new OffscreenCanvas(THUMB_WIDTH, THUMB_HEIGHT);
  let gl;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  } catch (e) {
    console.error('WebGL not available in this Node.js build. Install canvas with node-gyp support.');
    process.exit(1);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true });
  renderer.setSize(THUMB_WIDTH, THUMB_HEIGHT);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const loader = new GLTFLoader();

  // ── Process ──
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];

  for (const asset of assetsToProcess) {
    const thumbPath = path.join(THUMB_DIR, `${asset.id}.png`);
    const glbPath = resolveGlbPath(asset.model);

    if (!glbPath) {
      failed++;
      failures.push(`${asset.id}: GLB not found for ${asset.model}`);
      console.log(`  ✗ ${asset.id}: GLB not found`);
      continue;
    }

    console.log(`  Rendering ${asset.id} (${asset.manufacturer}) from ${path.relative(__dirname, glbPath)}...`);

    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          `file://${glbPath}`,
          resolve,
          undefined,
          (err) => reject(err)
        );
      });

      const model = gltf.scene;
      const norm = getNormalization(asset);

      if (norm.scale !== 1) {
        model.scale.set(norm.scale, norm.scale, norm.scale);
      }
      if (norm.rotation[0] !== 0 || norm.rotation[1] !== 0 || norm.rotation[2] !== 0) {
        model.rotation.set(norm.rotation[0], norm.rotation[1], norm.rotation[2]);
      }
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      if (size.x <= 0 && size.y <= 0 && size.z <= 0) {
        failed++;
        failures.push(`${asset.id}: empty model`);
        console.log(`    ✗ empty model`);
        continue;
      }

      // Frame camera
      const maxDim = Math.max(size.x, size.y, size.z, 1);
      const aspect = THUMB_WIDTH / THUMB_HEIGHT;
      const fovRad = (40 * Math.PI) / 180;
      const halfFov = fovRad / 2;

      let fitDim = maxDim;
      if (aspect > 1) {
        fitDim = size.y > size.x ? size.y : size.x * aspect;
      } else {
        fitDim = size.x > size.y ? size.x : size.y / aspect;
      }

      const dist = (fitDim / 2) / Math.tan(halfFov) * 1.5;
      const elev = Math.PI / 7;
      const camX = dist * Math.sin(elev) * 0.6;
      const camY = dist * Math.cos(elev) + size.y * 0.3;
      const camZ = dist * Math.sin(elev) * 0.8;

      const camera = new THREE.PerspectiveCamera(40, aspect, 1, 50000);
      const camYPos = box.isEmpty() ? center.y + camY : Math.max(center.y + camY, box.min.y + 50);
      camera.position.set(center.x + camX, camYPos, center.z + camZ);
      camera.lookAt(center);

      // Scene + lighting
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      const key = new THREE.DirectionalLight(0xffffff, 1.0);
      key.position.set(2, 4, 3);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffffff, 0.3);
      fill.position.set(-2, 1, -1);
      scene.add(fill);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      scene.add(model);

      renderer.render(scene, camera);

      // Extract PNG
      const blob = await new Promise((resolve) => canvas.convertToBlob.call(canvas, { type: 'image/png' }, resolve));
      if (!blob) {
        failed++;
        failures.push(`${asset.id}: failed to create blob`);
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(thumbPath, buffer);

      const fileSize = buffer.length;
      if (fileSize < 100) {
        fs.unlinkSync(thumbPath);
        failed++;
        failures.push(`${asset.id}: thumbnail too small (${fileSize} bytes)`);
        console.log(`    ✗ too small (${fileSize}B)`);
        continue;
      }

      success++;
      console.log(`    ✓ ${asset.id}.png (${fileSize}B) — ${Math.round(size.x)}×${Math.round(size.y)}×${Math.round(size.z)} mm`);

      // Clean up
      model.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    } catch (err) {
      failed++;
      const msg = err?.message || String(err);
      failures.push(`${asset.id}: ${msg}`);
      console.log(`    ✗ ${msg}`);
    }
  }

  // ── Update manifest with thumbnail paths ──
  if (success > 0) {
    for (const asset of assets) {
      const thumbPath = path.join(THUMB_DIR, `${asset.id}.png`);
      if (fs.existsSync(thumbPath)) {
        asset.thumbnail = `/assets/thumbnails/${asset.id}.png`;
      }
    }

    const withThumb = assets.filter((a) => a.thumbnail).length;
    console.log(`\nUpdated manifest: ${withThumb}/${assets.length} assets now have thumbnails`);
  }

  console.log(`\nDone: ${success} generated, ${failed} failed, ${assetsToProcess.length - success - failed} skipped`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
