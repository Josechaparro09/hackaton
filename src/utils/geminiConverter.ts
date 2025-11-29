import type { ExtractedApplianceData } from '@/lib/gemini-service';
import type { Appliance as DBAppliance } from '@/types/database';

/**
 * Convierte datos extraídos de Gemini + horas de uso a formato de base de datos
 */
export function geminiDataToDB(
  geminiData: ExtractedApplianceData,
  dailyHours: number
): Omit<DBAppliance, 'id' | 'created_at' | 'user_id'> {
  // Parsear temperatura de operación si está en formato de rango
  let operatingTempMin: number | null = geminiData.operating_temp_min || null;
  let operatingTempMax: number | null = geminiData.operating_temp_max || null;

  // Si hay operating_temp_range pero no min/max, intentar parsear
  // Nota: operating_temp_range no está en ExtractedApplianceData, pero lo dejamos por si se agrega en el futuro

  return {
    name: geminiData.name,
    category: geminiData.category,
    power_watts: geminiData.power_watts,
    daily_hours: dailyHours,
    quantity: 1,
    // Campos adicionales de Gemini
    monthly_consumption_kwh: geminiData.monthly_consumption_kwh,
    energy_efficiency: geminiData.energy_efficiency,
    appliance_type: geminiData.appliance_type,
    cooling_capacity_w: geminiData.cooling_capacity_w,
    cooling_capacity_btu: geminiData.cooling_capacity_btu,
    operating_temp_range: operatingTempMin && operatingTempMax 
      ? `${operatingTempMin} °C a ${operatingTempMax} °C`
      : null,
    operating_temp_min: operatingTempMin,
    operating_temp_max: operatingTempMax,
    filters_count: geminiData.filters_count,
    energy_rating: geminiData.energy_rating,
    brand: geminiData.brand,
    model: geminiData.model,
    image_url: null, // Se puede agregar después si se sube a storage
  };
}

