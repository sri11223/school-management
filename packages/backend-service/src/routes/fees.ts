import express, { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();

router.get('/', asyncHandler(async (req: any, res: any) => {
  res.json({ message: 'Fees endpoint - Coming soon' });
}));

export default router;
