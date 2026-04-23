import { supabase } from './supabase';

// Get current user profile
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not logged in' };

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
};

// Save user name and passcode
export const saveUserInfo = async (name, passcode) => {
  return updateUserProfile({ name, passcode });
};

// Save birth data
export const saveBirthData = async (birthData) => {
  return updateUserProfile({
    birth_date: birthData.date,
    birth_time: birthData.time,
    birth_place: birthData.place?.name,
    birth_lat: birthData.place?.lat,
    birth_lng: birthData.place?.lng,
  });
};

// Save kundli data
export const saveKundliData = async (kundliData) => {
  return updateUserProfile({ kundli_data: kundliData });
};

// Mark user as paid
export const markUserAsPaid = async () => {
  return updateUserProfile({
    is_paid: true,
    payment_date: new Date().toISOString(),
  });
};

// Check payment status
export const checkPaymentStatus = async () => {
  const result = await getUserProfile();
  if (result.success) {
    return { 
      success: true, 
      isPaid: result.data?.is_paid || false,
      profile: result.data
    };
  }
  return { success: false, isPaid: false };
};

export default {
  getUserProfile,
  updateUserProfile,
  saveUserInfo,
  saveBirthData,
  saveKundliData,
  markUserAsPaid,
  checkPaymentStatus,
};