import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
// Rate limiting for /auth/* is applied at the path level in index.js via authLimiter.
// Do NOT import or re-apply a per-route limiter here — that would stack two
// differently-configured limiters on the same request and double-count hits.
import * as authController from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and profile management endpoints
 */

/**
 * @swagger
 * /auth/create-profile:
 *   post:
 *     summary: Create a user profile after Supabase sign-up
 *     description: >
 *       Called immediately after `supabase.auth.signUp()` succeeds on the client.
 *       Requires a valid Supabase access_token in the Authorization header.
 *       Creates the matching row in the `profiles` table and, for students,
 *       validates the class code and enrols them in the corresponding class.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - full_name
 *               - role
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Supabase auth user ID (must match the token's subject).
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               full_name:
 *                 type: string
 *                 description: User's full display name.
 *                 example: "Ms. Amara Osei"
 *               role:
 *                 type: string
 *                 enum: [teacher, student]
 *                 description: Account role — determines which fields are required.
 *                 example: "teacher"
 *               school_name:
 *                 type: string
 *                 description: Required when role is "teacher".
 *                 example: "Westfield Academy"
 *               class_code:
 *                 type: string
 *                 description: Required when role is "student". Case-insensitive.
 *                 example: "BIO-3A"
 *     responses:
 *       201:
 *         description: Profile created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Missing or invalid fields in the request body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value: { "error": "Missing required fields" }
 *               invalidRole:
 *                 summary: Invalid role value
 *                 value: { "error": "Invalid role" }
 *       401:
 *         description: Missing, invalid, or expired Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { "error": "Invalid or expired token" }
 *       403:
 *         description: Token subject does not match the supplied id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { "error": "You can only create a profile for your own account." }
 *       404:
 *         description: Class code not found (student role only).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { "error": "Class code not found. Check with your teacher." }
 *       429:
 *         description: Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { "error": "Too many login or sign-up attempts from this IP. Please wait 15 minutes before trying again." }
 *       500:
 *         description: Unexpected server or database error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-profile', verifyToken, authController.createProfile);

export default router;
