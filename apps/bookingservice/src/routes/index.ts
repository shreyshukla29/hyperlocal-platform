import express from 'express';
import { v1Router, webhookRouter } from './v1';

export const router = express.Router();

router.use('/api/v1', v1Router);

export { webhookRouter };
