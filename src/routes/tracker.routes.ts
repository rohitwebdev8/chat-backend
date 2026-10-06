import { Router } from 'express';
import { getDailyLogs, getDailyLogByDate, saveDailyLog } from '../controllers/tracker.controller.js';

const router = Router();

router.get('/', getDailyLogs);
router.get('/:date', getDailyLogByDate);
router.post('/', saveDailyLog);

export default router;
