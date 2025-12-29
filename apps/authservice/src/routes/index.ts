import express from 'express';
import {v1Router} from './v1';

export const router = express.Router();

router.use('/v1', v1Router);


