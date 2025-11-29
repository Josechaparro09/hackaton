export interface Profile {
  id: string;
  full_name: string | null;
  region: string;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Appliance {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  power_watts: number;
  daily_hours: number;
  quantity: number | null;
  created_at: string | null;
}

export interface Prediction {
  id: string;
  user_id: string | null;
  total_daily_consumption_kwh: number;
  total_monthly_consumption_kwh: number;
  recommended_solar_panels: number;
  panel_wattage: number;
  battery_capacity_kwh: number;
  inverter_capacity_kw: number;
  estimated_cost: number | null;
  savings_yearly: number | null;
  payback_period_years: number | null;
  created_at: string | null;
}

export interface ClimatePrediction {
  id: string;
  user_id: string | null;
  date: string;
  region: string;
  solar_radiation_kwh_m2: number | null;
  temperature_avg: number | null;
  cloud_coverage_percent: number | null;
  estimated_production_kwh: number | null;
  created_at: string | null;
}

export type DatabaseTable = 'profiles' | 'appliances' | 'predictions' | 'climate_predictions';

