import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Firebase UID or similar Auth uuid
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const floorplans = sqliteTable('floorplans', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  data: text('data', { mode: 'json' }).notNull(), // JSON serializable
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const assets = sqliteTable('assets', {
  assetId: text('assetId').primaryKey(),
  assetType: text('assetType').notNull(),
  downloadUrl: text('downloadUrl'),
  fileExt: text('fileExt'),
  fileSize: integer('fileSize'),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  thumbnailUrl: text('thumbnailUrl'),
  sourceUrl: text('sourceUrl'),
  createdAt: text('createdAt'),
  scrapedAt: text('scrapedAt'),
  scrapedFrom: text('scrapedFrom')
});

export const floorplanItems = sqliteTable('floorplan_items', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => assets.assetId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  itemObjectType: text('item_object_type'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  itemWidth: integer('item_width'),
  itemHeight: integer('item_height'),
  config: text('config', { mode: 'json' }).$type<{
    colors?: string[];
    textures?: string[];
    defaultScale?: number;
    resizingConstraints?: { minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number };
  }>(),
  groupId: text('group_id').references(() => floorplanItemGroups.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const floorplanItemGroups = sqliteTable('floorplan_item_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const assetSources = sqliteTable('asset_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  baseUrl: text('base_url'),
  sourceType: text('source_type').notNull(), // 'crawler', 'api', 'upload'
  config: text('config', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const assetJobs = sqliteTable('asset_jobs', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').references(() => assetSources.id),
  jobType: text('job_type').notNull(), // 'collect', 'modify', 'export'
  status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed'
  progress: integer('progress').default(0),
  logs: text('logs'),
  result: text('result', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});
