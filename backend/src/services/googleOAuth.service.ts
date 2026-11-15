import { google } from 'googleapis';
import { prisma } from '../config/db';
import { createOAuth2Client, getGoogleAuthUrl, getTokensFromCode, getUserInfo } from '../config/google';
import { encrypt, decrypt } from '../config/encryption';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';

export class GoogleOAuthService {
  /**
   * Generates authorization URL bound securely to initiating user's ID
   */
  public static getAuthUrl(userId: string): string {
    return getGoogleAuthUrl(userId);
  }

  /**
   * Handles OAuth callback from Google and links connection to authenticated user
   */
  public static async handleCallback(code: string, stateUserId?: string) {
    logger.info('Processing Google OAuth callback...');
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error('Google did not return an access token.');
    }

    if (!stateUserId) {
      throw new Error('Invalid OAuth state. User binding is missing.');
    }

    // Verify target user exists
    const user = await prisma.user.findUnique({
      where: { id: stateUserId },
    });

    if (!user) {
      throw new Error(`User with ID ${stateUserId} not found.`);
    }

    // Get user profile from Google to determine their connected Gmail address
    const userInfo = await getUserInfo(tokens.access_token);
    const googleEmail = userInfo.email;

    if (!googleEmail) {
      throw new Error('Could not retrieve email from Google profile.');
    }

    // Encrypt refresh token if returned
    let encryptedRefreshToken = '';
    let iv = '';
    let authTag = '';

    if (tokens.refresh_token) {
      const enc = encrypt(tokens.refresh_token);
      encryptedRefreshToken = enc.encrypted;
      iv = enc.iv;
      authTag = enc.authTag;
    } else {
      // Check existing connection
      const existing = await prisma.gmailConnection.findUnique({
        where: { userId: stateUserId },
      });
      if (existing) {
        encryptedRefreshToken = existing.encryptedRefreshToken;
        iv = existing.iv;
        authTag = existing.authTag;
      } else {
        throw new Error('No refresh token received from Google. Please re-authorize with consent prompt.');
      }
    }

    // Upsert into per-user GmailConnection table
    const connection = await prisma.gmailConnection.upsert({
      where: { userId: stateUserId },
      create: {
        userId: stateUserId,
        gmailAddress: googleEmail,
        encryptedRefreshToken,
        iv,
        authTag,
        connected: true,
        tokenVersion: 1,
      },
      update: {
        gmailAddress: googleEmail,
        encryptedRefreshToken,
        iv,
        authTag,
        connected: true,
        tokenVersion: { increment: 1 },
      },
    });

    // Record audit event
    await logAudit({
      actorUserId: stateUserId,
      action: 'GMAIL_CONNECTED',
      targetUserId: stateUserId,
      metadata: {
        gmailAddress: googleEmail,
        tokenVersion: connection.tokenVersion,
      },
    });

    logger.info(`Successfully stored Gmail connection for User ${user.email} -> ${googleEmail}`);
    return { user, connection, googleEmail };
  }

  /**
   * Retrieves status of connected Google account for a user
   */
  public static async getConnectionStatus(userId: string) {
    const conn = await prisma.gmailConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        gmailAddress: true,
        connected: true,
        tokenVersion: true,
        updatedAt: true,
      },
    });

    if (!conn || !conn.connected) {
      return { isConnected: false, account: null };
    }

    return {
      isConnected: true,
      account: {
        email: conn.gmailAddress,
        lastVerified: conn.updatedAt,
      },
    };
  }

  /**
   * Disconnects a user's Gmail account
   */
  public static async disconnect(userId: string) {
    const conn = await prisma.gmailConnection.findUnique({ where: { userId } });
    if (conn) {
      await prisma.gmailConnection.update({
        where: { userId },
        data: { connected: false },
      });

      await logAudit({
        actorUserId: userId,
        action: 'GMAIL_DISCONNECTED',
        targetUserId: userId,
        metadata: { gmailAddress: conn.gmailAddress },
      });
    }

    return { success: true };
  }

  /**
   * Builds an authenticated OAuth2Client for a specific user with auto-refreshing access token
   */
  public static async getAuthorizedClient(userId: string) {
    const conn = await prisma.gmailConnection.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!conn || !conn.connected) {
      throw new Error('No active Gmail account connected for this user. Please connect your Gmail via OAuth.');
    }

    // Decrypt the refresh token using AES-256-GCM
    const refreshToken = decrypt(conn.encryptedRefreshToken, conn.iv, conn.authTag);

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Request fresh access token
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      throw new Error('Failed to refresh Google access token. Please re-authenticate your Gmail connection.');
    }

    const senderName = conn.user?.fullName || conn.gmailAddress.split('@')[0];

    return {
      oauth2Client,
      senderEmail: conn.gmailAddress,
      senderName,
    };
  }
}
