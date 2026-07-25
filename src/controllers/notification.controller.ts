import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import {
  ApiResponse,
  RegisterTokenRequest,
  SendNotificationRequest,
  UnregisterTokenRequest,
} from '../types/notification.types.js';

/**
 * GET /health
 */
export function getHealth(_req: Request, res: Response<ApiResponse>): void {
  res.status(200).json({
    success: true,
    message: 'Chat notification server is running',
  });
}

/**
 * POST /api/notifications/register
 */
export function registerToken(
  req: Request<unknown, unknown, RegisterTokenRequest>,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Push token is required and must be a string',
      });
      return;
    }

    const { success } = notificationService.registerToken(token);

    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Invalid Expo push token format',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Push token registered successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications/unregister
 */
export function unregisterToken(
  req: Request<unknown, unknown, UnregisterTokenRequest>,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Push token is required and must be a string',
      });
      return;
    }

    notificationService.unregisterToken(token);

    res.status(200).json({
      success: true,
      message: 'Push token unregistered successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notifications/send
 */
export async function sendNotification(
  req: Request<unknown, unknown, SendNotificationRequest>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId, roomName, senderName, senderToken, messageType, text } = req.body;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ success: false, message: 'roomId is required and must be a string' });
      return;
    }

    if (!roomName || typeof roomName !== 'string') {
      res.status(400).json({ success: false, message: 'roomName is required and must be a string' });
      return;
    }

    if (!senderName || typeof senderName !== 'string') {
      res.status(400).json({ success: false, message: 'senderName is required and must be a string' });
      return;
    }

    if (!senderToken || typeof senderToken !== 'string') {
      res.status(400).json({ success: false, message: 'senderToken is required and must be a string' });
      return;
    }

    if (messageType !== 'text' && messageType !== 'voice') {
      res.status(400).json({ success: false, message: 'messageType must be either "text" or "voice"' });
      return;
    }

    if (messageType === 'text' && (!text || typeof text !== 'string')) {
      res.status(400).json({ success: false, message: 'text is required for text messages and must be a string' });
      return;
    }

    const result = await notificationService.sendNotification({
      roomId,
      roomName,
      senderName,
      senderToken,
      messageType,
      text,
    });

    res.status(200).json({
      success: true,
      message: 'Notification processing completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
