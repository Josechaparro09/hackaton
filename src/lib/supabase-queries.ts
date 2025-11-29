import { supabase } from './supabase';
import type { Profile, Appliance, Prediction, ClimatePrediction } from '@/types/database';

// Profiles
export const getProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
};

export const getProfile = async (id: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Profile;
};

export const createProfile = async (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('profiles').insert(profile).select().single();
  if (error) throw error;
  return data as Profile;
};

export const updateProfile = async (id: string, profile: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
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
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
};

// Appliances
export const getAppliances = async () => {
  const { data, error } = await supabase.from('appliances').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Appliance[];
};

export const getAppliance = async (id: string) => {
  const { data, error } = await supabase.from('appliances').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Appliance;
};

export const createAppliance = async (appliance: Omit<Appliance, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('appliances').insert(appliance).select().single();
  if (error) throw error;
  return data as Appliance;
};

export const updateAppliance = async (id: string, appliance: Partial<Omit<Appliance, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase.from('appliances').update(appliance).eq('id', id).select().single();
  if (error) throw error;
  return data as Appliance;
};

export const deleteAppliance = async (id: string) => {
  const { error } = await supabase.from('appliances').delete().eq('id', id);
  if (error) throw error;
};

// Predictions
export const getPredictions = async () => {
  const { data, error } = await supabase.from('predictions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Prediction[];
};

export const getPrediction = async (id: string) => {
  const { data, error } = await supabase.from('predictions').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Prediction;
};

export const createPrediction = async (prediction: Omit<Prediction, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('predictions').insert(prediction).select().single();
  if (error) throw error;
  return data as Prediction;
};

export const updatePrediction = async (id: string, prediction: Partial<Omit<Prediction, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase.from('predictions').update(prediction).eq('id', id).select().single();
  if (error) throw error;
  return data as Prediction;
};

export const deletePrediction = async (id: string) => {
  const { error } = await supabase.from('predictions').delete().eq('id', id);
  if (error) throw error;
};

// Climate Predictions
export const getClimatePredictions = async () => {
  const { data, error } = await supabase
    .from('climate_predictions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ClimatePrediction[];
};

export const getClimatePrediction = async (id: string) => {
  const { data, error } = await supabase.from('climate_predictions').select('*').eq('id', id).single();
  if (error) throw error;
  return data as ClimatePrediction;
};

export const createClimatePrediction = async (prediction: Omit<ClimatePrediction, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('climate_predictions').insert(prediction).select().single();
  if (error) throw error;
  return data as ClimatePrediction;
};

export const updateClimatePrediction = async (
  id: string,
  prediction: Partial<Omit<ClimatePrediction, 'id' | 'created_at'>>
) => {
  const { data, error } = await supabase
    .from('climate_predictions')
    .update(prediction)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ClimatePrediction;
};

export const deleteClimatePrediction = async (id: string) => {
  const { error } = await supabase.from('climate_predictions').delete().eq('id', id);
  if (error) throw error;
};

