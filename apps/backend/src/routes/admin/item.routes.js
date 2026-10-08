import { Router } from 'express';
import { listItems, getItemHistory, updateStatus } from '../../controllers/itemsController.js';

const router = Router();

router.get('/', listItems);
router.get('/:id/history', getItemHistory);
router.put('/:id/status', updateStatus);

export default router;
