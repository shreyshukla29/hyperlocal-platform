import express from 'express';
import { InfoController } from '../../controllers';

const router = express.Router();

router.get('/info', InfoController.info);

export default router;
