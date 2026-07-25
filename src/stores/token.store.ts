import { ITokenStore } from '../types/notification.types.js';

export class InMemoryTokenStore implements ITokenStore {
  private tokens: Set<string> = new Set<string>();

  /**
   * Helper to mask push token for safe logging (e.g. ExponentPushToken[...abcd])
   */
  private maskToken(token: string): string {
    if (token.length > 25) {
      return `${token.substring(0, 20)}...${token.substring(token.length - 4)}`;
    }
    return '***masked_token***';
  }

  /**
   * Adds an Expo push token to the store idempotently.
   * @returns true if added, false if already registered.
   */
  public addToken(token: string): boolean {
    if (this.tokens.has(token)) {
      return false;
    }
    this.tokens.add(token);
    console.log(`[TokenStore] Token registered: ${this.maskToken(token)} (Total: ${this.tokens.size})`);
    return true;
  }

  /**
   * Removes an Expo push token from the store.
   * @returns true if removed, false if not found.
   */
  public removeToken(token: string): boolean {
    const deleted = this.tokens.delete(token);
    if (deleted) {
      console.log(`[TokenStore] Token removed: ${this.maskToken(token)} (Remaining: ${this.tokens.size})`);
    }
    return deleted;
  }

  /**
   * Returns an array of all currently registered Expo push tokens.
   */
  public getTokens(): string[] {
    return Array.from(this.tokens);
  }

  /**
   * Checks if a token is registered.
   */
  public hasToken(token: string): boolean {
    return this.tokens.has(token);
  }

  /**
   * Clears all stored tokens.
   */
  public clear(): void {
    this.tokens.clear();
    console.log('[TokenStore] Token store cleared');
  }
}

// Export a singleton instance for application use
export const tokenStore = new InMemoryTokenStore();
