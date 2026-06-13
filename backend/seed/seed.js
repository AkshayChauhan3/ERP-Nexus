const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: Starting database seeding...');

  // 1. Seed Modules
  const modulesToSeed = [
    { name: 'sales', desc: 'Sales Order management and Customer relations' },
    { name: 'purchase', desc: 'Purchase Order management, Vendors and Goods Receipts' },
    { name: 'manufacturing', desc: 'Bill of Materials, Operations and Manufacturing Orders' },
    { name: 'inventory', desc: 'Stock Ledger, Warehousing and Stock status tracking' },
  ];

  console.log('Seed: Initializing ERP Modules...');
  for (const item of modulesToSeed) {
    await prisma.module.upsert({
      where: { module_name: item.name },
      update: { description: item.desc },
      create: {
        module_name: item.name,
        description: item.desc,
        is_active: true,
      },
    });
  }
  console.log(`Seed: Mapped ${modulesToSeed.length} modules.`);

  // 2. Hash default passwords
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  const ownerPasswordHash = await bcrypt.hash('owner', 10);

  // 3. Seed Admin Super User
  console.log('Seed: Seeding Admin User...');
  const adminUser = await prisma.user.upsert({
    where: { login_id: 'admin' },
    update: {
      password: adminPasswordHash,
      role: 'admin',
      is_admin: true,
      status: 'APPROVED',
    },
    create: {
      login_id: 'admin',
      email: 'admin@erp-nexus.local',
      password: adminPasswordHash,
      role: 'admin',
      is_admin: true,
      status: 'APPROVED',
      profile: {
        create: {
          full_name: 'System Administrator',
          position: 'Administrator',
          email_display: 'admin@erp-nexus.local',
        },
      },
    },
  });

  // 4. Seed Owner Super User (Admin Task + Finance)
  console.log('Seed: Seeding Owner User...');
  const ownerUser = await prisma.user.upsert({
    where: { login_id: 'owner' },
    update: {
      password: ownerPasswordHash,
      role: 'owner',
      is_admin: true,
      status: 'APPROVED',
    },
    create: {
      login_id: 'owner',
      email: 'owner@erp-nexus.local',
      password: ownerPasswordHash,
      role: 'owner',
      is_admin: true,
      status: 'APPROVED',
      profile: {
        create: {
          full_name: 'Business Owner',
          position: 'Owner',
          email_display: 'owner@erp-nexus.local',
        },
      },
    },
  });

  console.log('Seed: Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
