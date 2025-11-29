import { WeatherForecast, SolarPrediction, BatteryPrediction } from "@/types/weather";
import { Appliance } from "@/types/appliance";
import { calculateConsumption } from "./consumptionCalculator";

// Constantes para el cálculo de energía solar
const SOLAR_PANEL_EFFICIENCY = 0.20; // 20% de eficiencia típica
const SOLAR_PANEL_AREA_M2 = 10; // Área típica de paneles solares (10 m²)
const HOURS_PER_DAY = 24;
const BATTERY_EFFICIENCY = 0.90; // 90% de eficiencia de carga/descarga
const MIN_BATTERY_CAPACITY_FACTOR = 1.5; // Capacidad de batería recomendada (1.5x el consumo diario)

/**
 * Calcula la generación solar basada en la radiación solar
 * @param radiation W/m² de radiación solar
 * @returns kWh generados en esa hora
 */
function calculateSolarGeneration(radiation: number): number {
	// Conversión: W/m² * horas * área * eficiencia / 1000 = kWh
	const hourlyGeneration =
		(radiation * 1 * SOLAR_PANEL_AREA_M2 * SOLAR_PANEL_EFFICIENCY) / 1000;
	return Math.max(0, hourlyGeneration); // No puede ser negativo
}

/**
 * Calcula la predicción de generación solar basada en datos meteorológicos
 */
export function calculateSolarPrediction(
	weather: WeatherForecast
): SolarPrediction {
	const hourlyBreakdown = weather.hourly.time.map((time, index) => {
		const radiation = weather.hourly.shortwave_radiation[index] || 0;
		const solarGeneration = calculateSolarGeneration(radiation);
		return {
			time,
			solarGeneration,
			radiation,
		};
	});

	// Suma total diaria (primeros 24 horas)
	const dailySolarGeneration = hourlyBreakdown
		.slice(0, 24)
		.reduce((sum, hour) => sum + hour.solarGeneration, 0);

	const monthlySolarGeneration = dailySolarGeneration * 30;
	const yearlySolarGeneration = dailySolarGeneration * 365;

	return {
		dailySolarGeneration,
		monthlySolarGeneration,
		yearlySolarGeneration,
		hourlyBreakdown,
	};
}

/**
 * Calcula la predicción de almacenamiento en baterías
 */
export function calculateBatteryPrediction(
	appliances: Appliance[],
	solarPrediction: SolarPrediction,
	pricePerKwh: number
): BatteryPrediction {
	const consumption = calculateConsumption(appliances, pricePerKwh);

	const dailyConsumption = consumption.dailyKwh;
	const dailySolarGeneration = solarPrediction.dailySolarGeneration;

	// Energía que se puede almacenar en baterías (con eficiencia)
	const dailyBatteryCharge =
		Math.min(dailySolarGeneration, dailySolarGeneration * BATTERY_EFFICIENCY);

	// Capacidad de batería necesaria (recomendación: 1.5x el consumo diario)
	const batteryCapacityNeeded = dailyConsumption * MIN_BATTERY_CAPACITY_FACTOR;

	// Excedente o déficit de energía
	const energySurplus = Math.max(0, dailySolarGeneration - dailyConsumption);
	const energyDeficit = Math.max(0, dailyConsumption - dailySolarGeneration);

	// Días de autonomía (cuántos días puede funcionar solo con baterías)
	const autonomyDays =
		batteryCapacityNeeded > 0
			? (batteryCapacityNeeded * BATTERY_EFFICIENCY) / dailyConsumption
			: 0;

	// Eficiencia del sistema (% de energía solar que cubre el consumo)
	const solarEfficiency =
		dailyConsumption > 0
			? Math.min(100, (dailySolarGeneration / dailyConsumption) * 100)
			: 0;

	return {
		dailyConsumption,
		dailySolarGeneration,
		dailyBatteryCharge,
		batteryCapacityNeeded,
		energySurplus,
		energyDeficit,
		autonomyDays,
		solarEfficiency,
	};
}

