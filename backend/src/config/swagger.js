/**
 * config/swagger.js — OpenAPI / Swagger Documentation Setup
 *
 * What this file does:
 *   Configures swagger-jsdoc to generate an OpenAPI 3.0 specification from
 *   the JSDoc comments inside our route files.
 *   
 *   This spec is then served by swagger-ui-express in app.js at /api/docs.
 *
 *   WHY IS THIS IMPORTANT?
 *   The frontend developer relies on this live documentation to know:
 *     - What endpoints exist
 *     - What request body to send
 *     - What response to expect
 *     - Which endpoints require which roles
 *
 *   It prevents the backend and frontend from blocking each other.
 */

const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ERP Nexus API',
    version: '1.0.0',
    description: 'Autonomous Factory OS Backend API. \n\n**Authentication**: Use the `/api/auth/login` endpoint to get an access token. Then click the **Authorize** button below and enter `Bearer <your_token>`.',
    contact: {
      name: 'Backend Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT access token',
      },
    },
    // We define common reusable schemas here so we don't repeat them in every route file
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message description' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
              },
            },
          },
        },
      },
    },
  },
  // Apply the security scheme to all endpoints by default (can be overridden per route)
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  // Path to the API docs (we will add JSDoc comments to our route files)
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
