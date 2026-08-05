import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Asset } from '@myfloorplan/shared';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from the crawler root
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// R2 Configuration
const R2_ENDPOINT_URL = process.env.R2_ENDPOINT_URL;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

// D1 Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  if (!R2_ENDPOINT_URL || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 credentials in environment variables.');
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

export async function uploadToR2(filePath: string, objectName: string, contentType?: string): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error('Missing R2_BUCKET_NAME in environment variables.');
  }

  const s3 = getS3Client();
  const fileStream = fs.createReadStream(filePath);

  console.log(`Uploading ${filePath} to R2 bucket ${R2_BUCKET_NAME} as ${objectName}...`);

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectName,
      Body: fileStream,
      ContentType: contentType,
    })
  );

  console.log(`Upload complete: ${objectName}`);

  // Return a relative URL
  return `/${objectName}`;
}

export async function executeD1Query(sql: string, params: any[] = []): Promise<any> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !D1_DATABASE_ID) {
    throw new Error('Missing Cloudflare D1 credentials in environment variables.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`D1 API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function initD1Schema(): Promise<void> {
  // Drop table to allow recreation with new schema since this is early dev
  const dropSql = `DROP TABLE IF EXISTS assets;`;
  await executeD1Query(dropSql);

  const sql = `
    CREATE TABLE assets (
        assetId TEXT PRIMARY KEY,
        assetType TEXT NOT NULL,
        downloadUrl TEXT,
        fileExt TEXT,
        fileSize INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        thumbnailUrl TEXT,
        sourceUrl TEXT,
        createdAt TEXT,
        scrapedAt TEXT,
        scrapedFrom TEXT
    );

    CREATE TABLE floorplan_items (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        name TEXT NOT NULL,
        item_object_type TEXT,
        tags TEXT, -- JSON array
        item_width INTEGER,
        item_height INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (asset_id) REFERENCES assets(assetId) ON DELETE CASCADE
    );

    CREATE TABLE tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    );
  `;
  await executeD1Query(sql);
  console.log('D1 schema initialized with FloorplanItems and Tags.');
}

export async function insertAssetMetadata(asset: Asset): Promise<void> {
  const sql = `
    INSERT INTO assets (assetId, assetType, downloadUrl, fileExt, fileSize, name, description, category, thumbnailUrl, sourceUrl, createdAt, scrapedAt, scrapedFrom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    asset.assetId,
    asset.assetType,
    asset.downloadUrl,
    asset.fileExt,
    asset.fileSize || null,
    asset.name,
    asset.description,
    asset.category,
    asset.thumbnailUrl,
    asset.sourceUrl,
    asset.createdAt,
    asset.scrapedAt,
    asset.scrapedFrom
  ];

  await executeD1Query(sql, params);
  console.log(`Inserted metadata for ${asset.name} (${asset.assetType}) with ID ${asset.assetId}`);
}

export async function getAllAssets(): Promise<any[]> {
  const sql = `SELECT * FROM assets`;
  const result = await executeD1Query(sql);
  return result.result[0].results;
}

export async function updateAssetThumbnail(assetId: string, thumbnailUrl: string): Promise<void> {
  const sql = `UPDATE assets SET thumbnailUrl = ? WHERE assetId = ?`;
  await executeD1Query(sql, [thumbnailUrl, assetId]);
}
