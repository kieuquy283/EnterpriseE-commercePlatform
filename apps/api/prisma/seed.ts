import { PrismaClient, ProductStatus, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

async function main() {
  const products = [
    { title: 'Áo thun Essential', description: 'Áo thun cotton tối giản, phù hợp mặc hằng ngày.', category: 'fashion', sku: 'TEE-ESSENTIAL-BLK', variant: 'Đen / M', price: 249000, stock: 25 },
    { title: 'Túi canvas Daily', description: 'Túi canvas bền nhẹ cho công việc và đi học.', category: 'accessories', sku: 'BAG-DAILY-NAT', variant: 'Natural', price: 189000, stock: 18 },
    { title: 'Bình giữ nhiệt 500ml', description: 'Bình inox giữ nhiệt cho ngày năng động.', category: 'lifestyle', sku: 'BOT-500-SLV', variant: 'Silver', price: 329000, stock: 12 }
  ];
  for (const p of products) {
    await db.product.upsert({
      where: { id: p.sku },
      update: {},
      create: {
        id: p.sku,
        title: p.title,
        description: p.description,
        category: p.category,
        status: ProductStatus.ACTIVE,
        variants: {
          create: {
            sku: p.sku,
            title: p.variant,
            price: p.price,
            inventory: { create: { quantityOnHand: p.stock } }
          }
        }
      }
    });
  }

  // Seed Admin user
  const adminEmail = 'admin@commerce.local';
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash: await argon2.hash('Admin@123456'),
        role: UserRole.ADMIN,
        customer: { create: { firstName: 'Admin', lastName: 'Store' } }
      }
    });
    console.log('Seeded admin: admin@commerce.local / Admin@123456');
  }

  // Seed Customer user
  const customerEmail = 'customer@commerce.local';
  const existingCustomer = await db.user.findUnique({ where: { email: customerEmail } });
  if (!existingCustomer) {
    await db.user.create({
      data: {
        email: customerEmail,
        passwordHash: await argon2.hash('Customer@123456'),
        role: UserRole.CUSTOMER,
        customer: { create: { firstName: 'Nguyễn', lastName: 'An' } }
      }
    });
    console.log('Seeded customer: customer@commerce.local / Customer@123456');
  }
}

main().finally(() => db.$disconnect());

