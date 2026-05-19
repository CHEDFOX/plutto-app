/**
 * AUTH CONFIG — OAuth credentials.
 *
 * APPLE:
 *   No client ID needed here. Apple's identity flow uses the iOS bundle ID
 *   (com.jyotish.app, set in app.json). You DO need to configure the Apple
 *   provider in your Supabase dashboard:
 *     Supabase Console → Authentication → Providers → Apple
 *     Required fields: Services ID, Team ID, Key ID, Private Key (.p8 file)
 *     — all from your Apple Developer account.
 *
 * GOOGLE:
 *   You need three OAuth 2.0 Client IDs from Google Cloud Console
 *   (APIs & Services → Credentials → Create Credentials → OAuth client ID):
 *     1. Web application (use this on Supabase + as webClientId here)
 *        Add  https://auth.plutto.space/auth/v1/callback  to its
 *        Authorized redirect URIs.
 *     2. iOS application (bundle ID: com.jyotish.app)
 *     3. Android application (package: com.jyotish.app; needs SHA-1)
 *   Then in Supabase Console → Authentication → Providers → Google,
 *   paste the WEB Client ID + Client Secret.
 */

export const GOOGLE_OAUTH = {
  webClientId:     'PASTE_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
  iosClientId:     'PASTE_IOS_CLIENT_ID_HERE.apps.googleusercontent.com',
  androidClientId: 'PASTE_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com',
};

export function isGoogleConfigured() {
  return !GOOGLE_OAUTH.webClientId.startsWith('PASTE_');
}