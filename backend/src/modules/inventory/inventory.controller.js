const inventoryService = require('./inventory.service');

async function getWarehouses(req, res) {
  try {
    const data = await inventoryService.getWarehouses();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createWarehouse(req, res) {
  try {
    const data = await inventoryService.createWarehouse(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getInventory(req, res) {
  try {
    const data = await inventoryService.getInventory(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getTransfers(req, res) {
  try {
    const data = await inventoryService.getTransfers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createTransfer(req, res) {
  try {
    const data = await inventoryService.createTransfer(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function completeTransfer(req, res) {
  try {
    const data = await inventoryService.completeTransfer(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getAdjustments(req, res) {
  try {
    const data = await inventoryService.getAdjustments();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createAdjustment(req, res) {
  try {
    const data = await inventoryService.createAdjustment(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getLedger(req, res) {
  try {
    const data = await inventoryService.getStockLedger(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getReserved(req, res) {
  try {
    const data = await inventoryService.getReservedStock();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getWarehouses,
  createWarehouse,
  getInventory,
  getTransfers,
  createTransfer,
  completeTransfer,
  getAdjustments,
  createAdjustment,
  getLedger,
  getReserved,
};
