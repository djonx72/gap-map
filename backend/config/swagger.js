/**
 * swagger.js — OpenAPI / Swagger configuration.
 *
 * swagger-jsdoc scans all route and controller files for JSDoc @swagger comments
 * and assembles them into a single OpenAPI 3.0 spec automatically.
 *
 * The spec is served as (development only):
 *   GET /api-docs        → interactive Swagger UI
 *   GET /api-docs.json   → raw JSON spec (useful for code-gen tools)
 *
 * In production, applySwagger() exits immediately without mounting anything —
 * this is the second, independent layer of the two-layer production guard
 * (the first being the environment check in index.js).
 *
 * Adding a new endpoint is as simple as adding a @swagger JSDoc block above the
 * route handler — this file never needs to be touched.
 */
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GapMap API',
      version: '1.0.0',
      description:
        'AI-powered learning gap detection platform. ' +
        'All protected endpoints require a Supabase Bearer token in the Authorization header.',
      contact: {
        name: 'De Jon X',
        url: 'https://github.com/djonx72/gap-map',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? (process.env.BACKEND_URL || '/') 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Supabase access_token obtained from supabase.auth.signUp() or signInWithPassword().',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Missing required fields',
            },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Profile created successfully',
            },
          },
        },
      },
    },
  },
  // Scan these globs for @swagger JSDoc blocks — add new file patterns here as the
  // project grows, e.g. './routes/classes.js' or './controllers/*.js'
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * applySwagger — mounts the Swagger UI and raw JSON spec onto an Express app.
 *
 * Defense-in-depth: this function independently blocks itself in production,
 * regardless of whether the caller (index.js) has already gated the call.
 * If the index.js gate is ever accidentally removed or bypassed in a future
 * change, this guard independently stops Swagger from being served.
 *
 * @param {import('express').Application} app
 */
export function applySwagger(app) {
  // ── Production guard (layer 2 of 2) ──────────────────────────────────────
  // Layer 1 is in index.js: applySwagger is only called when NODE_ENV !== 'production'.
  // This layer 2 guard is independent: even if layer 1 is bypassed, Swagger
  // will never be served in production.
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[Security] Swagger blocked in production — ' +
      'API documentation is not served in this environment.'
    );
    return; // Exit immediately — no routes are mounted.
  }

  // ── Development only ─────────────────────────────────────────────────────
  // Interactive UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'GapMap API Docs',
    swaggerOptions: {
      persistAuthorization: true, // keeps the Bearer token between page reloads
    },
  }));

  // Raw JSON spec (for Postman import, code-gen, etc.)
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
