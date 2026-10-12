import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import argon2 from 'argon2';
import { z } from 'zod';
import { PrismaClient, Prisma, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

const db = new PrismaClient();
const app = Fastify({ logger: true, genReqId: () => `req_${crypto.randomUUID()}` });
await app.register(cors, { origin: true, credentials: true });
await app.register(cookie, { secret: process.env.COOKIE_SECRET ?? 'dev-cookie-secret' });
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-jwt-secret' });

type AuthUser = { id: string; role: UserRole; customerId?: string };
declare module 'fastify' { interface FastifyRequest { authUser?: AuthUser } }

const auth = async (request: any, reply: any) => {
  try {
    const payload = await request.jwtVerify() as { id: string; role: UserRole; customerId?: string };
    request.authUser = payload;
  } catch { return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', request_id: request.id } }); }
};
const admin = async (request: any, reply: any) => { await auth(request, reply); if (request.authUser && !['ADMIN', 'STAFF'].includes(request.authUser.role)) return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Admin access required', request_id: request.id } }); };
const ok = (data: unknown, request: any) => ({ data, request_id: request.id });
const fail = (code: string, message: string, request: any) => ({ error: { code, message, request_id: request.id } });

app.get('/health', async () => ({ status: 'ok', service: 'commerce-api' }));

app.post('/store/auth/register', async (request, reply) => {
  const body = z.object({ email: z.email(), password: z.string().min(8), firstName: z.string().min(1), lastName: z.string().min(1) }).parse(request.body);
  try {
    const user = await db.user.create({ data: { email: body.email.toLowerCase(), passwordHash: await argon2.hash(body.password), customer: { create: { firstName: body.firstName, lastName: body.lastName } } }, include: { customer: true } });
    const token = app.jwt.sign({ id: user.id, role: user.role, customerId: user.customer?.id });
    return reply.code(201).send(ok({ token, user: { id: user.id, email: user.email, role: user.role } }, request));
  } catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return reply.code(409).send(fail('EMAIL_EXISTS', 'Email already exists', request)); throw e; }
});
app.post('/store/auth/login', async (request, reply) => {
  const body = z.object({ email: z.email(), password: z.string() }).parse(request.body);
  const user = await db.user.findUnique({ where: { email: body.email.toLowerCase() }, include: { customer: true } });
  if (!user || !(await argon2.verify(user.passwordHash, body.password))) return reply.code(401).send(fail('INVALID_CREDENTIALS', 'Invalid email or password', request));
  const token = app.jwt.sign({ id: user.id, role: user.role, customerId: user.customer?.id });
  return ok({ token, user: { id: user.id, email: user.email, role: user.role } }, request);
});

app.get('/store/products', async (request) => { const q = z.object({ q: z.string().optional(), category: z.string().optional(), limit: z.coerce.number().min(1).max(100).default(20), offset: z.coerce.number().min(0).default(0) }).parse(request.query); const products = await db.product.findMany({ where: { status: 'ACTIVE', ...(q.category ? { category: q.category } : {}), ...(q.q ? { OR: [{ title: { contains: q.q, mode: 'insensitive' } }, { description: { contains: q.q, mode: 'insensitive' } }, { variants: { some: { sku: { contains: q.q, mode: 'insensitive' } } } }] } : {}) }, include: { variants: { include: { inventory: true } } }, take: q.limit, skip: q.offset, orderBy: { createdAt: 'desc' } }); return ok(products, request); });
app.get('/store/products/:id', async (request, reply) => { const { id } = z.object({ id: z.string() }).parse(request.params); const product = await db.product.findUnique({ where: { id }, include: { variants: { include: { inventory: true } } } }); if (!product) return reply.code(404).send(fail('NOT_FOUND', 'Product not found', request)); return ok(product, request); });

app.post('/store/carts', { preHandler: auth }, async (request: any, reply) => { const cart = await db.cart.create({ data: { customerId: request.authUser.customerId } }); return reply.code(201).send(ok(cart, request)); });
app.get('/store/carts/:id', { preHandler: auth }, async (request: any, reply) => { const { id } = z.object({ id: z.string() }).parse(request.params); const cart = await db.cart.findFirst({ where: { id, customerId: request.authUser.customerId }, include: { items: { include: { variant: { include: { product: true, inventory: true } } } } } }); if (!cart) return reply.code(404).send(fail('NOT_FOUND', 'Cart not found', request)); return ok(cart, request); });
app.post('/store/carts/:id/items', { preHandler: auth }, async (request: any, reply) => { const { id } = z.object({ id: z.string() }).parse(request.params); const body = z.object({ variantId: z.string(), quantity: z.number().int().positive() }).parse(request.body); const cart = await db.cart.findFirst({ where: { id, customerId: request.authUser.customerId, status: 'ACTIVE' } }); const variant = await db.productVariant.findUnique({ where: { id: body.variantId }, include: { inventory: true } }); if (!cart || !variant) return reply.code(404).send(fail('NOT_FOUND', 'Cart or variant not found', request)); if (!variant.inventory || variant.inventory.quantityOnHand - variant.inventory.quantityReserved < body.quantity) return reply.code(409).send(fail('OUT_OF_STOCK', 'Not enough stock', request)); const item = await db.cartItem.upsert({ where: { cartId_variantId: { cartId: id, variantId: body.variantId } }, update: { quantity: { increment: body.quantity } }, create: { cartId: id, variantId: body.variantId, quantity: body.quantity, unitPrice: variant.price } }); await recalculateCart(id); return ok(item, request); });

app.post('/store/carts/:id/checkout', { preHandler: auth }, async (request: any, reply) => { const { id: cartId } = z.object({ id: z.string() }).parse(request.params); const { idempotencyKey } = z.object({ idempotencyKey: z.string().uuid() }).parse(request.body); const cart = await db.cart.findFirst({ where: { id: cartId, customerId: request.authUser.customerId, status: 'ACTIVE' }, include: { items: { include: { variant: { include: { inventory: true, product: true } } } } } }); if (!cart || !cart.items.length) return reply.code(400).send(fail('CART_INVALID', 'Cart is empty or unavailable', request)); try { const result = await db.$transaction(async (tx) => { const existing = await tx.payment.findUnique({ where: { provider_idempotencyKey: { provider: 'mock', idempotencyKey } }, include: { order: true } }); if (existing?.order) return existing.order; let total = 0; for (const item of cart.items) { const inv = item.variant.inventory; if (!inv) throw new Error('OUT_OF_STOCK'); const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "InventoryItem" WHERE id = ${inv.id} AND "quantityOnHand" - "quantityReserved" >= ${item.quantity} FOR UPDATE`); if (!locked.length) throw new Error('OUT_OF_STOCK'); total += item.unitPrice * item.quantity; } const payment = await tx.payment.create({ data: { cartId, provider: 'mock', status: PaymentStatus.AUTHORIZED, amount: total, idempotencyKey, externalRef: `mock_${crypto.randomUUID()}` } }); for (const item of cart.items) await tx.inventoryItem.update({ where: { id: item.variant.inventory!.id }, data: { quantityReserved: { increment: item.quantity }, version: { increment: 1 } } }); const order = await tx.order.create({ data: { customerId: request.authUser.customerId, cartId, paymentId: payment.id, currency: cart.currency, subtotal: total, total, items: { create: cart.items.map(i => ({ variantId: i.variantId, skuSnapshot: i.variant.sku, titleSnapshot: i.variant.product.title, quantity: i.quantity, unitPrice: i.unitPrice })) }, statusHistory: { create: { toStatus: OrderStatus.PENDING, actorId: request.authUser.id } } } }); await tx.cart.update({ where: { id: cartId }, data: { status: 'COMPLETED', subtotal: total, total } }); await tx.outboxEvent.create({ data: { aggregateType: 'Order', aggregateId: order.id, eventType: 'order.placed', payload: { orderId: order.id, customerId: request.authUser.customerId } } }); return order; }); return reply.code(201).send(ok(result, request)); } catch (e) { if (e instanceof Error && e.message === 'OUT_OF_STOCK') return reply.code(409).send(fail('OUT_OF_STOCK', 'Not enough stock', request)); if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') { const existing = await db.payment.findUnique({ where: { provider_idempotencyKey: { provider: 'mock', idempotencyKey } }, include: { order: true } }); if (existing?.order) return ok(existing.order, request); } throw e; } });
app.get('/store/orders', { preHandler: auth }, async (request: any) => ok(await db.order.findMany({ where: { customerId: request.authUser.customerId }, include: { items: true, statusHistory: true }, orderBy: { createdAt: 'desc' } }), request));
app.get('/store/orders/:id', { preHandler: auth }, async (request: any, reply) => { const { id } = z.object({ id: z.string() }).parse(request.params); const order = await db.order.findFirst({ where: { id, customerId: request.authUser.customerId }, include: { items: true, statusHistory: true } }); if (!order) return reply.code(404).send(fail('NOT_FOUND', 'Order not found', request)); return ok(order, request); });

app.get('/admin/orders', { preHandler: admin }, async (request) => ok(await db.order.findMany({ include: { items: true, customer: true }, orderBy: { createdAt: 'desc' } }), request));
app.patch('/admin/orders/:id/status', { preHandler: admin }, async (request: any, reply) => { const { id } = z.object({ id: z.string() }).parse(request.params); const { status } = z.object({ status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) }).parse(request.body); const order = await db.order.findUnique({ where: { id } }); if (!order) return reply.code(404).send(fail('NOT_FOUND', 'Order not found', request)); const updated = await db.$transaction(async tx => { const o = await tx.order.update({ where: { id }, data: { status } }); await tx.orderStatusHistory.create({ data: { orderId: id, fromStatus: order.status, toStatus: status as OrderStatus, actorId: request.authUser.id } }); await tx.outboxEvent.create({ data: { aggregateType: 'Order', aggregateId: id, eventType: 'order.status_changed', payload: { orderId: id, from: order.status, to: status } } }); return o; }); return ok(updated, request); });

async function recalculateCart(id: string) { const items = await db.cartItem.findMany({ where: { cartId: id } }); const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0); return db.cart.update({ where: { id }, data: { subtotal, total: subtotal } }); }
async function processOutbox() { const events = await db.outboxEvent.findMany({ where: { status: 'PENDING' }, take: 20, orderBy: { createdAt: 'asc' } }); for (const event of events) { await db.outboxEvent.update({ where: { id: event.id }, data: { status: 'PROCESSED', processedAt: new Date(), attempts: { increment: 1 } } }); app.log.info({ event: event.eventType, aggregateId: event.aggregateId }, 'async event processed'); } }
setInterval(() => processOutbox().catch(e => app.log.error(e)), 3000);
const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' }).then(() => app.log.info(`commerce api listening on ${port}`)).catch(e => { app.log.error(e); process.exit(1); });
