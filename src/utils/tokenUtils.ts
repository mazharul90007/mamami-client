export interface TokenPayload {
  email: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

export const tokenUtils = {
  /**
   * Check if a JWT token is valid and not expired
   */
  isValidToken(token: string | null): boolean {
    if (!token) return false;
    
    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  },

  /**
   * Decode a JWT token and return the payload
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;
    
    return new Date(payload.exp * 1000);
  },

  /**
   * Check if token expires soon (within 5 minutes)
   */
  isTokenExpiringSoon(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    return payload.exp - now < fiveMinutes;
  },

  /**
   * Get user email from token
   */
  getUserEmail(token: string): string | null {
    const payload = this.decodeToken(token);
    return payload?.email || null;
  },

  /**
   * Debug token information
   */
  debugToken(token: string | null): void {
    if (!token) {
      console.log('❌ No token found');
      return;
    }

    console.log('=== TOKEN DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');

    try {
      const payload = this.decodeToken(token);
      if (payload) {
        console.log('✅ Token is valid');
        console.log('User email:', payload.email);
        console.log('Issued at:', new Date(payload.iat * 1000));
        console.log('Expires at:', new Date(payload.exp * 1000));
        console.log('Is expired:', this.isValidToken(token) ? 'No' : 'Yes');
        console.log('Expires soon:', this.isTokenExpiringSoon(token) ? 'Yes' : 'No');
      } else {
        console.log('❌ Token is invalid');
      }
    } catch (error) {
      console.error('❌ Error parsing token:', error);
    }
  }
};

export default tokenUtils; 