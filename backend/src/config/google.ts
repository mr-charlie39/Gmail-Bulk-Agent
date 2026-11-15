import { google } from 'googleapis';
import { env } from './env';

export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
};

export const getGoogleAuthUrl = (state?: string): string => {
  const oauth2Client = createOAuth2Client();
  const scopes = env.GOOGLE_SCOPES.split(' ');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Ensures refresh token is provided
    scope: scopes,
    state: state || '',
  });
};

export const getTokensFromCode = async (code: string) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const getUserInfo = async (accessToken: string) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
};
