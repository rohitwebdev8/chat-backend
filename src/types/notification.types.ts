export type NotificationMessageType = 'text' | 'voice';

export interface RegisterTokenRequest {
  token: string;
}

export interface UnregisterTokenRequest {
  token: string;
}

export interface SendNotificationRequest {
  roomId: string;
  roomName: string;
  senderName: string;
  senderToken: string;
  messageType: NotificationMessageType;
  text?: string;
}

export interface NotificationDataPayload {
  roomId: string;
  roomName: string;
  messageType: NotificationMessageType;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ITokenStore {
  addToken(token: string): boolean;
  removeToken(token: string): boolean;
  getTokens(): string[];
  hasToken(token: string): boolean;
  clear(): void;
}
