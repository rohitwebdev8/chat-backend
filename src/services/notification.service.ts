import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { tokenStore } from '../stores/token.store.js';
import {
  ITokenStore,
  SendNotificationRequest,
} from '../types/notification.types.js';

export class NotificationService {
  private expo: Expo;
  private store: ITokenStore;

  constructor(store: ITokenStore = tokenStore) {
    this.expo = new Expo();
    this.store = store;
  }

  /**
   * Validates if a string is a valid Expo Push Token.
   */
  public isValidPushToken(token: string): boolean {
    return typeof token === 'string' && Expo.isExpoPushToken(token);
  }

  /**
   * Registers a token after validating its format.
   */
  public registerToken(token: string): { success: boolean; isNew: boolean } {
    if (!this.isValidPushToken(token)) {
      return { success: false, isNew: false };
    }
    const isNew = this.store.addToken(token);
    return { success: true, isNew };
  }

  /**
   * Unregisters a token from the store.
   */
  public unregisterToken(token: string): boolean {
    return this.store.removeToken(token);
  }

  /**
   * Sends push notifications to all registered devices except the sender.
   */
  public async sendNotification(
    request: SendNotificationRequest
  ): Promise<{ sent: number; recipientCount: number }> {
    const allTokens = this.store.getTokens();

    // Exclude the sender's device token
    const recipientTokens = allTokens.filter(
      (token) => token !== request.senderToken && this.isValidPushToken(token)
    );

    if (recipientTokens.length === 0) {
      console.log('[NotificationService] No recipient tokens available to send push notification.');
      return { sent: 0, recipientCount: 0 };
    }

    // Determine title, body, and data based on message type
    const title = request.senderName;
    const body =
      request.messageType === 'voice' ? 'Voice message' : request.text || 'New message';

    const messages: ExpoPushMessage[] = recipientTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        roomId: request.roomId,
        roomName: request.roomName,
        messageType: request.messageType,
      },
    }));

    // Chunk notifications as required by Expo Push API
    const chunks = this.expo.chunkPushNotifications(messages);
    let sentCount = 0;

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);
        
        // Inspect push tickets for errors and prune invalid tokens
        tickets.forEach((ticket, index) => {
          if (ticket.status === 'ok') {
            sentCount++;
          } else if (ticket.status === 'error') {
            console.error(`[NotificationService] Ticket error: ${ticket.message} (${ticket.details?.error})`);
            
            // If device is no longer registered, remove invalid token from store
            if (ticket.details?.error === 'DeviceNotRegistered') {
              const invalidToken = chunk[index]?.to;
              if (typeof invalidToken === 'string') {
                this.store.removeToken(invalidToken);
              }
            }
          }
        });
      } catch (error) {
        console.error('[NotificationService] Error sending notification chunk:', error);
      }
    }

    console.log(`[NotificationService] Sent ${sentCount} notifications to ${recipientTokens.length} recipients.`);
    return { sent: sentCount, recipientCount: recipientTokens.length };
  }
}

export const notificationService = new NotificationService();
