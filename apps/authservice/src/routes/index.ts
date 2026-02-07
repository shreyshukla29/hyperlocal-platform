import express from 'express';
import { v1Router } from './v1/index.js';

export const router = express.Router();

router.use('/api/v1', v1Router);
