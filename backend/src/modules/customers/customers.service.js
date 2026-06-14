const prisma = require('../../config/db');

async function getAllCustomers() {
  return await prisma.customer.findMany({
    orderBy: { name: 'asc' },
  });
}

async function getCustomerById(id) {
  return await prisma.customer.findUniqueOrThrow({
    where: { id },
  });
}

async function createCustomer(data) {
  let customerCode = data.customer_code;
  if (!customerCode) {
    const latestCustomer = await prisma.customer.findFirst({
      where: {
        customer_code: {
          startsWith: 'CUST-',
        },
      },
      orderBy: {
        customer_code: 'desc',
      },
    });

    let nextNum = 1;
    if (latestCustomer && latestCustomer.customer_code) {
      const match = latestCustomer.customer_code.match(/^CUST-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    customerCode = `CUST-${String(nextNum).padStart(3, '0')}`;
  }

  return await prisma.customer.create({
    data: {
      ...data,
      customer_code: customerCode,
    },
  });
}

async function updateCustomer(id, data) {
  return await prisma.customer.update({
    where: { id },
    data,
  });
}

async function deleteCustomer(id) {
  return await prisma.customer.delete({
    where: { id },
  });
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
