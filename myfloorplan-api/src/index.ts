import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('My Floorplan API'))

export default app
