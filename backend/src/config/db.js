

let PrismaClient;
try {
  ({ PrismaClient } = require('../generated/client'));
} catch (err) {
  ({ PrismaClient } = require('@prisma/client'));
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
