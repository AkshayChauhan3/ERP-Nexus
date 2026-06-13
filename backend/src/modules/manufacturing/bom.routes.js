const express = require('express');
const bomController = require('./bom.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bill of Materials
 *   description: Bill of Materials (BOM) management
 */

router.use(authenticate);

/**
 * @swagger
 * /boms:
 *   get:
 *     summary: Get all BOMs
 *     tags: [Bill of Materials]
 *     responses:
 *       200:
 *         description: List of BOMs
 */
router.get('/', authorize('admin', 'manufacturing', 'owner', 'inventory'), bomController.getAll);

/**
 * @swagger
 * /boms/{id}:
 *   get:
 *     summary: Get a BOM by ID
 *     tags: [Bill of Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: BOM object
 */
router.get('/:id', authorize('admin', 'manufacturing', 'owner', 'inventory'), bomController.getById);

/**
 * @swagger
 * /boms:
 *   post:
 *     summary: Create a new BOM
 *     tags: [Bill of Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, lines]
 *             properties:
 *               product_id: { type: 'string', format: 'uuid' }
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [component_product_id, qty_per_unit, operation]
 *                   properties:
 *                     component_product_id: { type: 'string', format: 'uuid' }
 *                     qty_per_unit: { type: 'number' }
 *                     operation: { type: 'string', enum: [assembly, painting, packing] }
 *     responses:
 *       201:
 *         description: BOM created
 */
router.post('/', authorize('admin', 'manufacturing', 'owner'), bomController.create);

/**
 * @swagger
 * /boms/{id}:
 *   patch:
 *     summary: Update a BOM (Replace all lines)
 *     tags: [Bill of Materials]
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
 *             required: [lines]
 *             properties:
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [component_product_id, qty_per_unit, operation]
 *                   properties:
 *                     component_product_id: { type: 'string', format: 'uuid' }
 *                     qty_per_unit: { type: 'number' }
 *                     operation: { type: 'string', enum: [assembly, painting, packing] }
 *     responses:
 *       200:
 *         description: BOM updated
 */
router.patch('/:id', authorize('admin', 'manufacturing'), bomController.update);

/**
 * @swagger
 * /boms/{id}:
 *   delete:
 *     summary: Delete a BOM
 *     tags: [Bill of Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: BOM deleted
 */
router.delete('/:id', authorize('admin', 'manufacturing'), bomController.remove);

module.exports = router;
