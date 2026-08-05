import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { authMiddleware } from './middleware/auth';
import { projects, floorplans, users, assets, floorplanItems, tags, assetSources, assetJobs, floorplanItemGroups } from './db/schema';

export type Env = {
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
};

// Application
const app = new Hono<{ Bindings: Env, Variables: { userId: string } }>();

app.use('*', logger());
app.use('*', cors());

// Healthcheck
app.get('/', (c) => c.text('My Floorplan API Edge Worker'));

app.get('/api/health', async (c) => {
  const db = drizzle(c.env.DB);
  let d1Status = 'ok';
  let r2Status = 'ok';

  try {
    await db.select().from(projects).limit(1);
  } catch (e) {
    console.error('D1 health check failed:', e);
    d1Status = 'error';
  }

  try {
    if (!c.env.ASSETS_BUCKET) {
      r2Status = 'not_bound';
    } else {
      // Test R2 by listing objects (max 1)
      await c.env.ASSETS_BUCKET.list({ limit: 1 });
    }
  } catch (e) {
    r2Status = 'error';
  }

  return c.json({
    status: d1Status === 'ok' && r2Status === 'ok' ? 'ok' : 'degraded',
    d1: d1Status,
    r2: r2Status,
    timestamp: new Date().toISOString()
  }, d1Status === 'error' || r2Status === 'error' ? 503 : 200);
});

// --- Authenticated routes ---
const api = app.basePath('/api').use('*', authMiddleware);

// -- Users --
api.post('/users/sync', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const db = drizzle(c.env.DB);
  
  // Upsert user based on Firebase auth sync
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!existingUser) {
    await db.insert(users).values({
      id: userId,
      email: body.email,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    await db.update(users)
      .set({ email: body.email, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
  return c.json({ success: true, userId });
});

// -- Projects --
api.get('/projects', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const results = await db.select().from(projects).where(eq(projects.userId, userId)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.userId, userId));
  
  return c.json({
    data: results,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
});

api.post('/projects', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const newProject = {
    id: crypto.randomUUID(), // Assuming Node crypto polyfill or use Web Crypto API `crypto.randomUUID()` in Worker
    userId,
    name: body.name || 'New Project',
    description: body.description || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(projects).values(newProject);
  return c.json(newProject, 201);
});

api.get('/projects/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json(project);
});

api.put('/projects/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }

  await db.update(projects)
    .set({
      name: body.name || project.name,
      description: body.description ?? project.description,
      updatedAt: new Date()
    })
    .where(eq(projects.id, projectId));
    
  return c.json({ success: true, id: projectId });
});

api.delete('/projects/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  
  // Verify ownership
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }

  await db.delete(projects).where(eq(projects.id, projectId));
  return c.json({ success: true });
});

// -- Floorplans --
api.get('/projects/:projectId/floorplan', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');

  // Verify project ownership
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const [floorplan] = await db.select().from(floorplans).where(eq(floorplans.projectId, projectId));
  if (!floorplan) {
    return c.json({ data: {} }); // Return empty or default
  }
  
  return c.json(floorplan);
});

api.put('/projects/:projectId/floorplan', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');
  const body = await c.req.json();

  // Verify project ownership
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.userId !== userId) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const [existingFloorplan] = await db.select().from(floorplans).where(eq(floorplans.projectId, projectId));
  
  if (!existingFloorplan) {
    const newId = crypto.randomUUID();
    await db.insert(floorplans).values({
      id: newId,
      projectId,
      data: body.data || {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return c.json({ success: true, id: newId });
  } else {
    await db.update(floorplans)
      .set({ data: body.data || existingFloorplan.data, updatedAt: new Date() })
      .where(eq(floorplans.projectId, projectId));
    return c.json({ success: true, id: existingFloorplan.id });
  }
});

// -- Assets --
// Making GET /api/assets public since it's the global library
app.get('/api/assets', async (c) => {
  const db = drizzle(c.env.DB);
  const type = c.req.query('type');
  
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;
  
  let query = db.select({
    assetId: assets.assetId,
    assetType: assets.assetType,
    downloadUrl: assets.downloadUrl,
    fileExt: assets.fileExt,
    fileSize: assets.fileSize,
    name: assets.name,
    description: assets.description,
    category: assets.category,
    thumbnailUrl: assets.thumbnailUrl,
    sourceUrl: assets.sourceUrl,
    createdAt: assets.createdAt,
    scrapedAt: assets.scrapedAt,
    scrapedFrom: assets.scrapedFrom,
    itemObjectType: floorplanItems.itemObjectType,
    itemTags: floorplanItems.tags,
    itemWidth: floorplanItems.itemWidth,
    itemHeight: floorplanItems.itemHeight
  })
  .from(assets)
  .leftJoin(floorplanItems, eq(assets.assetId, floorplanItems.assetId));

  let countQuery = db.select({ count: sql<number>`count(*)` }).from(assets);
  
  if (type) {
    query = query.where(eq(assets.assetType, type)) as any;
    countQuery = countQuery.where(eq(assets.assetType, type)) as any;
  }
  
  const results = await query.limit(limit).offset(offset);
  const [{ count }] = await countQuery;
  
  return c.json({
    data: results,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
});

api.get('/tags', async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(tags);
  return c.json(results);
});

api.post('/assets', async (c) => {
  return c.json({ error: 'Not implemented: Asset upload logic (R2/S3) missing.' }, 501);
});


// Asset Sources
api.get('/asset-sources', async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(assetSources);
  return c.json(results);
});

api.post('/asset-sources', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date();
  
  await db.insert(assetSources).values({
    id,
    ...body,
    createdAt: now
  });
  
  return c.json({ id, status: 'success' });
});

// Asset Jobs
api.get('/asset-jobs', async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(assetJobs).orderBy(sql`${assetJobs.createdAt} DESC`);
  return c.json(results);
});

api.post('/asset-jobs', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date();
  
  await db.insert(assetJobs).values({
    id,
    ...body,
    status: 'pending',
    progress: 0,
    createdAt: now,
    updatedAt: now
  });
  
  return c.json({ id, status: 'success' });
});

// Item Groups
api.get('/item-groups', async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(floorplanItemGroups);
  return c.json(results);
});

api.post('/item-groups', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date();
  
  await db.insert(floorplanItemGroups).values({
    id,
    ...body,
    createdAt: now,
    updatedAt: now
  });
  
  return c.json({ id, status: 'success' });
});
export default app; 
