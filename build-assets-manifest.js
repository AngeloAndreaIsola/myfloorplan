#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE = '/Users/angeloandreaisola/Documents/GitHub/myfloorplan';
const PROCESSED = path.join(BASE, 'manufacturer-assets/processed');
const OUTPUT = path.join(BASE, 'manufacturer-assets/reports/viewer-assets.json');

const MANUFACTURER_MAP = {
  'L60': 'L60',
  'VIAVENETO': 'VIAVENETO',
  'QUATTRO.ZERO': 'QUATTRO.ZERO',
};

function extractDimensions(filename) {
  const name = filename.replace(/\.glb$/i, '');
  const lower = name.toLowerCase();

  // L60: bmdl1cebc1_moode_sinkunits_60x45x25
  const l60Match = name.match(/(\d+)x(\d+)x(\d+)/);
  if (l60Match) {
    return {
      width: parseInt(l60Match[1]) * 10,
      depth: parseInt(l60Match[2]) * 10,
      height: parseInt(l60Match[3]) * 10,
    };
  }

  // ViaVeneto/QUATTRO.ZERO: h90_w30-60_d35
  const hMatch = lower.match(/h(\d+)/);
  const wMatch = lower.match(/w(\d+)/);
  const dMatch = lower.match(/d(\d+)/);

  if (hMatch && wMatch && dMatch) {
    return {
      width: parseInt(wMatch[1]) * 10,
      depth: parseInt(dMatch[1]) * 10,
      height: parseInt(hMatch[1]) * 10,
    };
  }

  return { width: null, depth: null, height: null };
}

function extractCollection(filename) {
  const lower = filename.toLowerCase().replace(/\.glb$/, '');
  if (lower.startsWith('bmdl1')) return 'Sinks';
  if (lower.startsWith('bmdl2')) return 'Base Cabinets';
  if (lower.startsWith('column')) return 'Wall Columns';
  if (lower.startsWith('complete_unit')) return 'Complete Units';
  if (lower.startsWith('base')) return 'Base Cabinets';
  if (lower.startsWith('top')) return 'Countertops';
  if (lower.startsWith('open_comp')) return 'Open Compartments';
  if (lower.startsWith('wall_unit')) return 'Wall Units';
  if (lower.startsWith('countertop')) return 'Countertops';
  if (lower.startsWith('modular_base')) return 'Modular Bases';
  if (lower.startsWith('pre-assembled')) return 'Pre-Assembled Bases';
  return 'Other';
}

function extractFriendlyName(filename) {
  const lower = filename.toLowerCase().replace(/\.glb$/, '');

  // L60: bmdl1cebc1_moode_sinkunits_60x45x25
  const l60Match = lower.match(/(bmdl\d)(\w*)_(\w+)_(\w+)_(\d+x\d+x\d+)/);
  if (l60Match) {
    const typeWord = l60Match[3];     // sinkunits | skinunits
    const dims = l60Match[5];         // 60x45x25
    let label;
    if (typeWord === 'sinkunits') label = 'Sink';
    else if (typeWord === 'skinunits') label = 'Base';
    else label = 'Unit';
    // For skinunits, check if 2doors/2drawers
    const extra = l60Match[4];        // moode (ignored) or variant
    const full = filename.replace(/\.glb$/, '').replace(/_/g, ' ');
    if (full.toLowerCase().includes('2doors')) label = 'Base 2 Doors';
    else if (full.toLowerCase().includes('2drawers')) label = 'Base 2 Drawers';
    else if (full.toLowerCase().includes('1drawer')) label = 'Base 1 Drawer';
    return `${label} ${dims.replace(/x/g, '×')}`;
  }

  // ViaVeneto / QUATTRO.ZERO:
  // column_-_h90_w30-60_d35_-_1_door_dx_-_viaveneto_-_dgh
  // complete_unit_-_h36_w80_d45_-_2_drawers_sx_-_quattro_zero_-_ej

  // Split on underscore, reconstruct readable name
  const parts = filename.replace(/\.glb$/, '').split('_');

  let type = '';
  if (/^column/.test(parts[0])) type = 'Column';
  else if (/^complete/.test(parts[0])) type = 'Complete Unit';
  else if (/^base/.test(parts[0])) type = 'Base Cabinet';
  else if (/^top/.test(parts[0])) type = 'Countertop';
  else if (/^open/.test(parts[0])) type = 'Open Compartment';
  else if (/^wall/.test(parts[0])) type = 'Wall Unit';
  else if (/^countertop/.test(parts[0])) type = 'Countertop';
  else if (/^modular/.test(parts[0])) type = 'Modular Base';
  else if (/^pre/.test(parts[0])) type = 'Pre-Assembled Base';
  else type = 'Furniture';

  // Find dimensions in parts
  let dimStr = '';
  for (const p of parts) {
    const h = p.match(/^h(\d+)$/i);
    if (h) dimStr = ` ${h[1]}cm`;
  }

  // Find features after dims, before manufacturer
  // parts: [column, -, -, h90, w30-60, d35, -, -, 1, door, dx, -, -, viaveneto, -, -, dgh]
  // We want: "1 Door DX"
  let features = '';
  let inFeatures = false;
  for (const p of parts) {
    if (/^(viaveneto|quattro[\s_]*zero|l60)$/i.test(p)) break;
    if (inFeatures) {
      if (/^\d+$/.test(p)) features += p;
      else if (['door', 'doors', 'drawer', 'drawers', 'open', 'compartment', 'dx', 'sx', 'cx'].includes(p.toLowerCase())) {
        if (features.length > 0) features += ' ';
        features += p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      }
    }
    if (/^(h\d+)$/i.test(p)) inFeatures = true;
  }

  // For L60 base cabinets, the features are embedded differently
  // "bmdl2aedc1_moode_skinunits_2doors_60x46x50" -> parts separated by _
  // Already handled above by the l60Match

  return `${type}${dimStr}${features ? ' ' + features : ''}`.trim();
}

function extractSourceType(filename) {
  return filename.toLowerCase().includes('bmdl') ? '3DS' : 'DWG';
}

function extractConversionRoute(sourceType) {
  return sourceType === '3DS' ? '3DS → Assimp → GLB' : 'DWG → dwg2dxf → Assimp → GLB';
}

// Scan
const assets = [];
const manufacturers = fs.readdirSync(PROCESSED);

for (const mfrDir of manufacturers) {
  const mfrPath = path.join(PROCESSED, mfrDir);
  if (!fs.statSync(mfrPath).isDirectory()) continue;

  const manufacturer = MANUFACTURER_MAP[mfrDir] || mfrDir.toUpperCase();
  const files = fs.readdirSync(mfrPath).filter(f => f.toLowerCase().endsWith('.glb'));

  for (const filename of files) {
    const glbPath = path.join(mfrPath, filename);
    const relPath = path.relative(PROCESSED, glbPath).replace(/\\/g, '/');
    const stats = fs.statSync(glbPath);
    const dims = extractDimensions(filename);
    const collection = extractCollection(filename);
    const sourceType = extractSourceType(filename);

    assets.push({
      id: `asset_${assets.length}_${path.basename(filename, '.glb')}`,
      manufacturer,
      collection,
      name: extractFriendlyName(filename),
      sourceFile: filename,
      sourceType,
      conversionRoute: extractConversionRoute(sourceType),
      glbPath: `/processed/${relPath}`,
      glbAbsolutePath: glbPath,
      fileName: filename,
      fileSize: stats.size,
      width: dims.width,
      depth: dims.depth,
      height: dims.height,
      hasDimensions: dims.width !== null,
      validationStatus: 'valid',
    });
  }
}

assets.sort((a, b) => {
  if (a.manufacturer !== b.manufacturer) return a.manufacturer.localeCompare(b.manufacturer);
  return a.name.localeCompare(b.name);
});

assets.forEach((a, i) => {
  const slug = a.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
  a.id = `a${String(i).padStart(3, '0')}_${slug}`;
});

const manifest = {
  generatedAt: new Date().toISOString(),
  totalAssets: assets.length,
  byManufacturer: {},
  assets,
};

for (const a of assets) {
  manifest.byManufacturer[a.manufacturer] = (manifest.byManufacturer[a.manufacturer] || 0) + 1;
}

fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));

console.log(`✅ ${assets.length} assets`);
for (const [m, c] of Object.entries(manifest.byManufacturer)) {
  console.log(`   ${m}: ${c}`);
}
console.log('\n   First 10:');
assets.slice(0, 10).forEach(a => {
  const d = a.hasDimensions ? `${a.width}×${a.depth}×${a.height}mm` : '—';
  console.log(`     [${a.manufacturer}] ${a.name}  ${d}`);
});
