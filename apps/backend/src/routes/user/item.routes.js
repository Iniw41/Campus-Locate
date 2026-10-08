import { Router } from 'express';
import { reportItem, listItems, getItemHistory } from '../../controllers/itemsController.js';

const router = Router();

router.get('/', listItems);
router.post('/', reportItem);
router.get('/:id/history', getItemHistory);

export default router;
