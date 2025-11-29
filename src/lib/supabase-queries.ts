import { supabase } from './supabase';
import type { Profile, Appliance, Prediction, ClimatePrediction } from '@/types/database';

// Helper para obtener el usuario autenticado
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper para asegurar que existe un perfil para el usuario actual
// El id del perfil ES el mismo que el id del usuario de auth (profiles.id = auth.users.id)
export const ensureProfileExists = async (userId: string): Promise<string> => {
  // Verificar si ya existe un perfil (el id del perfil es el mismo que el userId)
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 es "no rows returned", que es esperado si no existe perfil
    throw fetchError;
  }

  // Si ya existe, retornar su ID (que es el mismo que userId)
  if (existingProfile) {
    return existingProfile.id;
  }

  // Si no existe, crear un perfil por defecto
  // El id del perfil debe ser el mismo que el userId (auth.users.id)
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId, // El id del perfil es el mismo que el id del usuario de auth
      full_name: null,
      region: 'Sin especificar',
      city: null,
    })
    .select('id')
    .single();

  if (createError) {
    // Si el error es de constraint único, significa que ya existe (race condition)
    // Intentar obtener el perfil nuevamente
    if (createError.code === '23505') {
      const { data: retryProfile, error: retryError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (retryError) throw retryError;
      if (retryProfile) return retryProfile.id;
    }
    throw createError;
  }

  if (!newProfile) {
    throw new Error('No se pudo crear el perfil');
  }

  return newProfile.id;
};

// Helper para obtener o crear el perfil del usuario actual
// Retorna el ID del perfil (que es el mismo que auth.users.id)
const getCurrentProfileId = async (): Promise<string | null> => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    return await ensureProfileExists(userId);
  } catch (error) {
    console.error('Error al obtener/crear perfil:', error);
    return null;
  }
};

// Profiles
export const getProfiles = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  
  // El id del perfil es el mismo que el userId
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
};

export const getProfile = async (id: string) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Usuario no autenticado');
  
  // Solo puede obtener su propio perfil (el id del perfil es el mismo que el userId)
  if (id !== userId) {
    throw new Error('No tienes permiso para acceder a este perfil');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Profile;
};

export const createProfile = async (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Usuario no autenticado');
  
  // El id del perfil debe ser el mismo que el userId
  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...profile, id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
};

export const updateProfile = async (id: string, profile: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Usuario no autenticado');
  
  // Solo puede actualizar su propio perfil
  if (id !== userId) {
    throw new Error('No tienes permiso para actualizar este perfil');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
};

export const deleteProfile = async (id: string) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Usuario no autenticado');
  
  // Solo puede eliminar su propio perfil
  if (id !== userId) {
    throw new Error('No tienes permiso para eliminar este perfil');
  }
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Appliances
export const getAppliances = async () => {
  const profileId = await getCurrentProfileId();
  if (!profileId) return [];
  
  const { data, error } = await supabase
    .from('appliances')
    .select('*')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Appliance[];
};

export const getAppliance = async (id: string) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('appliances')
    .select('*')
    .eq('id', id)
    .eq('user_id', profileId)
    .single();
  if (error) throw error;
  return data as Appliance;
};

export const createAppliance = async (appliance: Omit<Appliance, 'id' | 'created_at' | 'user_id'>) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('appliances')
    .insert({ ...appliance, user_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data as Appliance;
};

export const updateAppliance = async (id: string, appliance: Partial<Omit<Appliance, 'id' | 'created_at' | 'user_id'>>) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('appliances')
    .update(appliance)
    .eq('id', id)
    .eq('user_id', profileId)
    .select()
    .single();
  if (error) throw error;
  return data as Appliance;
};

export const deleteAppliance = async (id: string) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { error } = await supabase
    .from('appliances')
    .delete()
    .eq('id', id)
    .eq('user_id', profileId);
  if (error) throw error;
};

// Predictions
export const getPredictions = async () => {
  const profileId = await getCurrentProfileId();
  if (!profileId) return [];
  
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Prediction[];
};

export const getPrediction = async (id: string) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', id)
    .eq('user_id', profileId)
    .single();
  if (error) throw error;
  return data as Prediction;
};

export const createPrediction = async (prediction: Omit<Prediction, 'id' | 'created_at' | 'user_id'>) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('predictions')
    .insert({ ...prediction, user_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data as Prediction;
};

export const updatePrediction = async (id: string, prediction: Partial<Omit<Prediction, 'id' | 'created_at' | 'user_id'>>) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('predictions')
    .update(prediction)
    .eq('id', id)
    .eq('user_id', profileId)
    .select()
    .single();
  if (error) throw error;
  return data as Prediction;
};

export const deletePrediction = async (id: string) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', id)
    .eq('user_id', profileId);
  if (error) throw error;
};

// Climate Predictions
export const getClimatePredictions = async () => {
  const profileId = await getCurrentProfileId();
  if (!profileId) return [];
  
  const { data, error } = await supabase
    .from('climate_predictions')
    .select('*')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ClimatePrediction[];
};

export const getClimatePrediction = async (id: string) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('climate_predictions')
    .select('*')
    .eq('id', id)
    .eq('user_id', profileId)
    .single();
  if (error) throw error;
  return data as ClimatePrediction;
};

export const createClimatePrediction = async (prediction: Omit<ClimatePrediction, 'id' | 'created_at' | 'user_id'>) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('climate_predictions')
    .insert({ ...prediction, user_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data as ClimatePrediction;
};

export const updateClimatePrediction = async (
  id: string,
  prediction: Partial<Omit<ClimatePrediction, 'id' | 'created_at' | 'user_id'>>
) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { data, error } = await supabase
    .from('climate_predictions')
    .update(prediction)
    .eq('id', id)
    .eq('user_id', profileId)
    .select()
    .single();
  if (error) throw error;
  return data as ClimatePrediction;
};

export const deleteClimatePrediction = async (id: string) => {
  const profileId = await getCurrentProfileId();
  if (!profileId) throw new Error('Usuario no autenticado o perfil no encontrado');
  
  const { error } = await supabase
    .from('climate_predictions')
    .delete()
    .eq('id', id)
    .eq('user_id', profileId);
  if (error) throw error;
};

