const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');

async function runLocalPopulation() {
  console.log('Fetching assets from local D1...');
  try {
    const output = execSync('npx wrangler d1 execute myfloorplan-db --local --command="SELECT * FROM assets" --json', {
      cwd: path.resolve(__dirname, '../../../myfloorplan-api'),
      encoding: 'utf8'
    });

    const result = JSON.parse(output);
    const assets = result[0].results;
    console.log(`Found ${assets.length} assets in local D1.`);

    const allTags = new Set();
    const sqlCommands = [];

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

    console.log('Executing SQL on local D1...');
    execSync(`npx wrangler d1 execute myfloorplan-db --local --file="${sqlFile}"`, {
      cwd: path.resolve(__dirname, '../../../myfloorplan-api'),
      stdio: 'inherit'
    });

    console.log('Local population complete.');
  } catch (e) {
    console.error('Error during local population:', e.message);
  }
}

runLocalPopulation();
