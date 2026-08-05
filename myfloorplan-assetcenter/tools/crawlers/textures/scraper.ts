import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import { uploadToR2, insertAssetMetadata, initD1Schema } from '../shared/cloudflare';
import { Asset } from '@myfloorplan/shared';

const AMBIENTCG_API_URL = "https://ambientcg.com/api/v2/full_json";
const LOG_FILE = path.join(__dirname, '..', 'temp', 'textures_processed.log');

function loadProcessedUrls(): Set<string> {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf-8');
      return new Set(data.split('\n').filter(Boolean));
    }
  } catch (e) {
    console.warn('Could not read processed log:', e);
  }
  return new Set();
}

function markAsProcessed(url: string) {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, url + '\n', 'utf-8');
  } catch (e) {
    console.warn('Could not write to processed log:', e);
  }
}

async function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 10;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && i + 1 < args.length) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { limit, dryRun };
}

async function scrape() {
  const { limit, dryRun } = await parseArgs();

  console.log(`Querying AmbientCG API for ${limit} materials...`);
  
  const url = new URL(AMBIENTCG_API_URL);
  url.searchParams.append('type', 'Material');
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('sort', 'Popular');
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch from AmbientCG: ${response.statusText}`);
  }
  
  const data = await response.json();
  const assets: any[] = data.foundAssets || [];
  
  console.log(`Found ${assets.length} textures.`);

  if (!dryRun) {
    try {
      await initD1Schema();
    } catch (e: any) {
      console.log(`Failed to initialize D1 schema: ${e.message}`);
      console.log("Assuming schema exists or credentials invalid. Proceeding...");
    }
  }

  const processedUrls = loadProcessedUrls();

  for (let i = 0; i < assets.length; i++) {
    const assetData = assets[i];
    const asset_id = assetData.assetId;
    const name = assetData.displayName;
    const category = assetData.displayCategory || 'Texture';
    const description = assetData.dataTypeDescription || '';
    
    // Get thumbnail
    const preview_imgs = assetData.previewImage || {};
    const thumbnailUrl = preview_imgs['512-JPG-FFFFFF'] || preview_imgs['512-PNG'] || '';
    
    // Construct download link for 1K JPG zip
    const downloadUrl = `https://ambientcg.com/get?file=${asset_id}_1K-JPG.zip`;
    
    if (processedUrls.has(downloadUrl)) {
      console.log(`[${i + 1}/${assets.length}] Skipping (already processed): ${name} (${asset_id})`);
      continue;
    }
    
    console.log(`[${i + 1}/${assets.length}] Processing: ${name} (${asset_id})`);
    console.log(`  Download URL: ${downloadUrl}`);
    
    if (dryRun) continue;

    try {
      console.log(`  Downloading...`);
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.statusText}`);
      
      const buffer = await fileRes.arrayBuffer();
      const fileSize = buffer.byteLength;
      
      // Create a temporary file
      const tmpPath = path.join(os.tmpdir(), `ambientcg_${crypto.randomUUID()}.zip`);
      fs.writeFileSync(tmpPath, Buffer.from(buffer));
      
      const objectName = `textures/ambientcg/${asset_id}_1K.zip`;
      const fileUrl = await uploadToR2(tmpPath, objectName, 'application/zip');
      
      const now = new Date().toISOString();
      const asset: Asset = {
        assetId: crypto.randomUUID(),
        assetType: 'texture',
        downloadUrl: fileUrl,
        fileExt: 'zip',
        fileSize,
        name,
        description,
        category,
        thumbnailUrl,
        sourceUrl: `https://ambientcg.com/a/${asset_id}`,
        createdAt: now,
        scrapedAt: now,
        scrapedFrom: downloadUrl
      };

      await insertAssetMetadata(asset);
      markAsProcessed(downloadUrl);
      
      // Cleanup temp file
      fs.unlinkSync(tmpPath);
      console.log(`  Successfully processed ${name}`);
      
    } catch (e: any) {
      console.log(`  Error processing ${name}: ${e.message}`);
    }
  }
}

scrape().catch(console.error);
