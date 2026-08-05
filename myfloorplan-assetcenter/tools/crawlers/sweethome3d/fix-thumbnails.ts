import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { uploadToR2, executeD1Query, getAllAssets, updateAssetThumbnail } from '../shared/cloudflare';

async function scrapePage(): Promise<{ name: string, url: string, thumbUrl: string }[]> {
  const pageUrl = 'https://www.sweethome3d.com/free-3d-models/';
  console.log(`Fetching ${pageUrl}`);
  
  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
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

  return zipLinks;
}

async function fixThumbnails() {
  console.log("Fetching assets from D1...");
  const assets = await getAllAssets();
  
  console.log(`Found ${assets.length} total assets.`);
  
  const missingThumbnails = assets.filter(a => a.assetType === 'model' && !a.thumbnailUrl);
  console.log(`Found ${missingThumbnails.length} assets missing thumbnails.`);
  
  if (missingThumbnails.length === 0) return;
  
  const zipLinks = await scrapePage();
  const urlMap = new Map<string, string>();
  for (const link of zipLinks) {
    urlMap.set(link.url, link.thumbUrl);
  }
  
  let count = 0;
  for (const asset of missingThumbnails) {
    count++;
    const thumbUrl = urlMap.get(asset.sourceUrl);
    if (!thumbUrl) {
      console.log(`[${count}/${missingThumbnails.length}] No thumbnail link found for ${asset.name}`);
      continue;
    }
    
    console.log(`[${count}/${missingThumbnails.length}] Fixing thumbnail for ${asset.name}...`);
    
    const tempDir = path.join(os.tmpdir(), `sweethome3d_thumb_${asset.assetId}`);
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      
      const thumbRes = await fetch(thumbUrl);
      if (thumbRes.ok) {
        const thumbBuffer = await thumbRes.arrayBuffer();
        const urlNoQuery = thumbUrl.split('?')[0];
        const thumbExt = urlNoQuery.split('.').pop() || 'png';
        const tmpThumbPath = path.join(tempDir, `thumb.${thumbExt}`);
        fs.writeFileSync(tmpThumbPath, Buffer.from(thumbBuffer));
        
        const thumbObject = `models/${asset.assetId}/thumbnails/thumbnail.${thumbExt}`;
        const uploadedThumbUrl = await uploadToR2(tmpThumbPath, thumbObject, `image/${thumbExt === 'jpg' ? 'jpeg' : thumbExt}`);
        
        await updateAssetThumbnail(asset.assetId, uploadedThumbUrl);
        console.log(`  -> Updated D1 with ${uploadedThumbUrl}`);
      } else {
        console.log(`  -> Failed to download thumbnail for ${asset.name}`);
      }
    } catch (e: any) {
      console.log(`  -> Error processing ${asset.name}: ${e.stack || e.message}`);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

fixThumbnails().catch(console.error);
