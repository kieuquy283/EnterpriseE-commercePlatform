import { PrismaClient, ProductStatus } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const products = [
    { title: 'Áo thun Essential', description: 'Áo thun cotton tối giản, phù hợp mặc hằng ngày.', category: 'fashion', sku: 'TEE-ESSENTIAL-BLK', variant: 'Đen / M', price: 249000, stock: 25 },
    { title: 'Túi canvas Daily', description: 'Túi canvas bền nhẹ cho công việc và đi học.', category: 'accessories', sku: 'BAG-DAILY-NAT', variant: 'Natural', price: 189000, stock: 18 },
    { title: 'Bình giữ nhiệt 500ml', description: 'Bình inox giữ nhiệt cho ngày năng động.', category: 'lifestyle', sku: 'BOT-500-SLV', variant: 'Silver', price: 329000, stock: 12 }
  ];
  for (const p of products) {
    await db.product.upsert({ where: { id: p.sku }, update: {}, create: { id: p.sku, title: p.title, description: p.description, category: p.category, status: ProductStatus.ACTIVE, variants: { create: { sku: p.sku, title: p.variant, price: p.price, inventory: { create: { quantityOnHand: p.stock } } } } } });
  }
}
main().finally(() => db.$disconnect());
