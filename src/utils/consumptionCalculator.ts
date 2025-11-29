import { Appliance, ConsumptionSummary } from "@/types/appliance";

export const calculateConsumption = (
  appliances: Appliance[],
  pricePerKwh: number
): ConsumptionSummary => {
  const dailyKwh = appliances.reduce((total, appliance) => {
    return total + (appliance.powerWatts * appliance.hoursPerDay) / 1000;
  }, 0);

  const monthlyKwh = dailyKwh * 30;
  const yearlyKwh = dailyKwh * 365;

  return {
    dailyKwh,
    monthlyKwh,
    yearlyKwh,
    dailyCost: dailyKwh * pricePerKwh,
    monthlyCost: monthlyKwh * pricePerKwh,
    yearlyCost: yearlyKwh * pricePerKwh,
  };
};

export const APPLIANCE_CATEGORIES = [
  "Refrigeración",
  "Climatización",
  "Cocina",
  "Lavado",
  "Entretenimiento",
  "Iluminación",
  "Otro",
];
