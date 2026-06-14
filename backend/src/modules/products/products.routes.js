const express = require('express');
const productController = require('./products.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product and inventory management
 */
router.use(authenticate);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Returns all products including the computed `free_qty` field.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', authorize('admin', 'inventory', 'owner', 'sales', 'purchase', 'manufacturing'), productController.getAll);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sales_price, cost_price]
 *             properties:
 *               name: { type: 'string' }
 *               sales_price: { type: 'number' }
 *               cost_price: { type: 'number' }
 *               procurement_type: { type: 'string', enum: [MTS, MTO] }
 *               procure_on_demand: { type: 'boolean' }
 *               vendor_id: { type: 'string', format: 'uuid' }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', authorize('admin', 'inventory', 'owner'), productController.create);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product object
 *       404:
 *         description: Product not found
 */
router.get('/:id', authorize('admin', 'inventory', 'owner', 'sales', 'purchase', 'manufacturing'), productController.getById);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: 'string' }
 *               sales_price: { type: 'number' }
 *               cost_price: { type: 'number' }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch('/:id', authorize('admin', 'inventory', 'owner', 'purchase'), productController.update);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', authorize('admin', 'inventory', 'owner'), productController.remove);

const fs = require('fs');
const path = require('path');

router.post('/upload-image', authorize('admin', 'inventory', 'owner'), async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, error: 'No image data provided' });
  }

  try {
    const uploadsDir = path.join(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid image format' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    const filename = `product-${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, dataBuffer);

    const imageUrl = `http://localhost:3000/uploads/${filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Image Upload Error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

module.exports = router;
