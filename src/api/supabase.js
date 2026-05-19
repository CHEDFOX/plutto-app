import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://auth.plutto.space';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbmZ1dGVpZnpkbWVic2VqbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjQ4NTQsImV4cCI6MjA4NjUwMDg1NH0.mZWdCCLuPBeUx79kVfGK9kAOtkuNg-3w3zB6tYBEXB4';

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const auth = {
  sendEmailCode: async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { data, error };
  },

  verifyEmailCode: async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { data, error };
  },

  signInWithApple: async (identityToken, nonce) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce,
    });
    return { data, error };
  },

  signInWithGoogle: async (idToken) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    return { data, error };
  },

  sendPhoneOtp:   async (phone) => supabase.auth.signInWithOtp({ phone }),
  verifyPhoneOtp: async (phone, token) => supabase.auth.verifyOtp({ phone, token, type: 'sms' }),

  getSession: async () => supabase.auth.getSession(),
  getUser:    async () => supabase.auth.getUser(),
  signOut:    async () => supabase.auth.signOut(),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),

  sendMagicLink: async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { data, error };
  },
};