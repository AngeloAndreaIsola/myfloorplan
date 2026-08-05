import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import AdmZip from 'adm-zip';
import obj2gltf from 'obj2gltf';
import sizeOf from 'image-size';
import { uploadToR2, insertAssetMetadata, initD1Schema } from '../shared/cloudflare';
import { Asset } from '@myfloorplan/shared';

const SWEETHOME3D_URL = "https://www.sweethome3d.com/free-3d-models/";
const LOG_FILE = path.join(__dirname, '..', 'temp', 'sweethome3d_processed.log');

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
  let limit = 0;
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

  console.log(`Fetching ${SWEETHOME3D_URL}...`);
  const response = await fetch(SWEETHOME3D_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  let zipLinks: { name: string, url: string, thumbUrl: string }[] = [];
  
  $('a[href$=".zip"]').each((_, element) => {
    const el = $(element);
    let href = el.attr('href');
    if (href) {
      const name = el.text().trim();
      if (href.startsWith('/')) {
        href = `https://www.sweethome3d.com${href}`;
      }
      
      let thumbUrl = '';
      const img = el.closest('.model-card').find('img.model-preview');
      if (img.length > 0) {
        thumbUrl = img.attr('data-src') || img.attr('src') || '';
        if (thumbUrl.startsWith('/')) {
          thumbUrl = `https://www.sweethome3d.com${thumbUrl}`;
        }
      }
      
      zipLinks.push({ name, url: href, thumbUrl });
    }
  });

  console.log(`Found ${zipLinks.length} model zips on page.`);
  
  if (limit > 0) {
    zipLinks = zipLinks.slice(0, limit);
    console.log(`Limiting to ${limit} items.`);
  }

  if (!dryRun) {
    try {
      await initD1Schema();
    } catch (e: any) {
      console.log(`Failed to initialize D1 schema: ${e.message}`);
      console.log("Assuming schema exists or credentials invalid. Proceeding...");
    }
  }

  const processedUrls = loadProcessedUrls();

  for (let i = 0; i < zipLinks.length; i++) {
    const { name, url, thumbUrl } = zipLinks[i];
    
    if (processedUrls.has(url)) {
      console.log(`[${i + 1}/${zipLinks.length}] Skipping (already processed): ${name}`);
      continue;
    }
    
    console.log(`[${i + 1}/${zipLinks.length}] Processing: ${name}`);
    console.log(`  URL: ${url}`);
    
    if (dryRun) continue;

    const assetId = crypto.randomUUID();
    const tempDir = path.join(os.tmpdir(), `sweethome3d_${assetId}`);
    
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      
      console.log(`  Downloading...`);
      const fileRes = await fetch(url);
      if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.statusText}`);
      
      const buffer = await fileRes.arrayBuffer();
      const zipPath = path.join(tempDir, 'model.zip');
      fs.writeFileSync(zipPath, Buffer.from(buffer));
      
      // Extract ZIP
      console.log(`  Extracting...`);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tempDir, true);
      
      // Find OBJ file
      const files = fs.readdirSync(tempDir, { recursive: true }) as string[];
      const objFile = files.find(f => f.toLowerCase().endsWith('.obj'));
      
      let gltfUrl = '';
      
      if (objFile) {
        const objFullPath = path.join(tempDir, objFile);
        const objFileName = path.basename(objFullPath);
        
        // Upload OBJ to R2
        console.log(`  Uploading OBJ...`);
        const objObject = `models/${assetId}/formats/obj/${objFileName}`;
        await uploadToR2(objFullPath, objObject);
        
        // Convert to GLTF (GLB)
        console.log(`  Converting to GLB...`);
        const glb = await obj2gltf(objFullPath, { binary: true });
        const glbFileName = objFileName.replace(/\.obj$/i, '.glb');
        const glbFullPath = path.join(tempDir, glbFileName);
        fs.writeFileSync(glbFullPath, glb);
        
        // Upload GLB to R2
        console.log(`  Uploading GLB...`);
        const glbObject = `models/${assetId}/formats/gltf/${glbFileName}`;
        gltfUrl = await uploadToR2(glbFullPath, glbObject);
      } else {
        console.log(`  No OBJ file found in ZIP. Falling back to ZIP upload.`);
        const objectName = `models/${assetId}/formats/zip/${path.basename(url)}`;
        gltfUrl = await uploadToR2(zipPath, objectName, 'application/zip');
      }
      
      // Process Thumbnail
      let uploadedThumbUrl = '';
      if (thumbUrl) {
         try {
           console.log(`  Downloading thumbnail: ${thumbUrl}`);
           const thumbRes = await fetch(thumbUrl);
           if (thumbRes.ok) {
             const thumbBuffer = await thumbRes.arrayBuffer();
             const urlNoQuery = thumbUrl.split('?')[0];
             const thumbExt = urlNoQuery.split('.').pop() || 'png';
             const tmpThumbPath = path.join(tempDir, `thumb.${thumbExt}`);
             fs.writeFileSync(tmpThumbPath, Buffer.from(thumbBuffer));
             
             console.log(`  Uploading thumbnail...`);
             const thumbObject = `models/${assetId}/thumbnails/thumbnail.${thumbExt}`;
             uploadedThumbUrl = await uploadToR2(tmpThumbPath, thumbObject, `image/${thumbExt === 'jpg' ? 'jpeg' : thumbExt}`);
           }
         } catch(e: any) {
           console.log(`  Error handling thumbnail: ${e.message}`);
         }
      }

      const now = new Date().toISOString();
      const asset: Asset = {
        assetId,
        assetType: 'model',
        downloadUrl: gltfUrl,
        fileExt: gltfUrl.endsWith('.glb') ? 'glb' : 'zip',
        fileSize: buffer.byteLength,
        name,
        description: `SweetHome3D Model: ${name}`,
        category: 'Furniture',
        thumbnailUrl: uploadedThumbUrl,
        sourceUrl: url,
        createdAt: now,
        scrapedAt: now,
        scrapedFrom: url
      };

      await insertAssetMetadata(asset);
      markAsProcessed(url);
      console.log(`  Successfully processed ${name}`);
      
    } catch (e: any) {
      console.log(`  Error processing ${name}: ${e.message}`);
    } finally {
      // Cleanup temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

scrape().catch(console.error);
