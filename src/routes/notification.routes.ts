import { Router } from 'express';
import {
  registerToken,
  sendNotification,
  unregisterToken,
} from '../controllers/notification.controller.js';

const router = Router();

router.post('/register', registerToken);
router.delete('/unregister', unregisterToken);
router.post('/send', sendNotification);

export default router;
