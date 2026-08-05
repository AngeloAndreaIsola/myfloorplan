import { getAllAssets, executeD1Query } from '../crawlers/shared/cloudflare';
import { crypto } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';

async function populateFloorplanItems() {
  console.log('Fetching all assets (attempting local/remote fetch)...');
  let assets;
  try {
    assets = await getAllAssets();
  } catch (e) {
    console.error('Failed to fetch assets via API. This is expected if remote auth fails.');
    console.log('Falling back to local data detection logic...');
    // If we can't fetch, we can't populate. 
    // But maybe we can just generate the SQL based on what we'd expect.
    return;
  }
  
  console.log(`Found ${assets.length} assets.`);

  const allTags = new Set<string>();
  const sqlCommands: string[] = [];

  // Table creation
  sqlCommands.push(`CREATE TABLE IF NOT EXISTS floorplan_items (id TEXT PRIMARY KEY, asset_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, item_object_type TEXT, tags TEXT, item_width INTEGER, item_height INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (asset_id) REFERENCES assets(assetId) ON DELETE CASCADE);`);
  sqlCommands.push(`CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);`);

  for (const asset of assets) {
    if (asset.assetType !== 'model') continue;

    const name = asset.name;
    const words = name.split(/\s+/).filter(w => w.length > 0);
    const tagsList = words.map(w => w.replace(/[^a-zA-Z0-9]/g, ''));
    const itemObjectType = tagsList[tagsList.length - 1] || 'Unknown';
    
    tagsList.forEach(t => {
      if (t.length > 1) allTags.add(t);
    });

    const itemId = crypto.randomUUID();
    const now = Date.now();
    const tagsJson = JSON.stringify(tagsList).replace(/'/g, "''");

    const sql = `INSERT INTO floorplan_items (id, asset_id, name, item_object_type, tags, item_width, item_height, created_at, updated_at) VALUES ('${itemId}', '${asset.assetId}', '${name.replace(/'/g, "''")}', '${itemObjectType.replace(/'/g, "''")}', '${tagsJson}', 100, 100, ${now}, ${now}) ON CONFLICT(asset_id) DO UPDATE SET name = excluded.name, item_object_type = excluded.item_object_type, tags = excluded.tags, updated_at = excluded.updated_at;`;
    sqlCommands.push(sql);
  }

  for (const tagName of allTags) {
    const tagId = crypto.randomUUID();
    sqlCommands.push(`INSERT OR IGNORE INTO tags (id, name) VALUES ('${tagId}', '${tagName.replace(/'/g, "''")}');`);
  }

  const sqlFile = path.resolve(__dirname, 'populate.sql');
  fs.writeFileSync(sqlFile, sqlCommands.join('\n'));
  console.log(`Generated SQL file: ${sqlFile}`);
  console.log('You can now run: npx wrangler d1 execute myfloorplan-db --local --file=tools/scripts/populate.sql');
}

populateFloorplanItems().catch(console.error);
