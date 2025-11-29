import { WeatherForecast, SolarPrediction, BatteryPrediction } from "@/types/weather";
import { Appliance } from "@/types/appliance";
import { calculateConsumption } from "./consumptionCalculator";
import { SolarSystemConfig } from "@/components/SolarSystemConfig";

/**
 * Calcula el factor de corrección por orientación e inclinación
 * @param orientation Grados desde el Norte (0-360)
 * @param tilt Grados de inclinación (0-90)
 * @param latitude Latitud del lugar
 * @returns Factor de corrección (0-1)
 */
function calculateOrientationTiltFactor(
	orientation: number,
	tilt: number,
	latitude: number
): number {
	// Para Colombia (hemisferio norte, cerca del ecuador), la orientación óptima es Sur (180°)
	const optimalOrientation = 180; // Sur
	
	// Factor de orientación: pérdida de eficiencia según desviación del Sur
	const orientationDeviation = Math.abs(orientation - optimalOrientation);
	let orientationFactor = 1.0;
	
	if (orientationDeviation <= 30) {
		orientationFactor = 1.0; // Óptimo
	} else if (orientationDeviation <= 60) {
		orientationFactor = 0.95; // Muy bueno
	} else if (orientationDeviation <= 90) {
		orientationFactor = 0.85; // Bueno
	} else if (orientationDeviation <= 135) {
		orientationFactor = 0.70; // Aceptable
	} else {
		orientationFactor = 0.60; // Pobre (cara al Norte)
	}
	
	// Factor de inclinación: óptimo es latitud - 10° para Colombia
	const optimalTilt = Math.max(0, latitude - 10);
	const tiltDeviation = Math.abs(tilt - optimalTilt);
	let tiltFactor = 1.0;
	
	if (tiltDeviation <= 10) {
		tiltFactor = 1.0; // Óptimo
	} else if (tiltDeviation <= 20) {
		tiltFactor = 0.98;
	} else if (tiltDeviation <= 30) {
		tiltFactor = 0.95;
	} else {
		tiltFactor = Math.max(0.85, 1 - (tiltDeviation - 30) * 0.005);
	}
	
	return orientationFactor * tiltFactor;
}

/**
 * Calcula la generación solar basada en la radiación solar
 * @param radiation W/m² de radiación solar
 * @param config Configuración del sistema solar
 * @param latitude Latitud del lugar (para calcular factores de corrección)
 * @returns kWh generados en esa hora
 */
function calculateSolarGeneration(
	radiation: number,
	config: SolarSystemConfig,
	latitude: number = 11
): number {
	const totalArea = config.solarPanelsCount * config.solarPanelAreaM2;
	
	// Factor de corrección por orientación e inclinación
	const orientationTiltFactor = calculateOrientationTiltFactor(
		config.panelOrientation,
		config.panelTilt,
		latitude
	);
	
	// Generación bruta: W/m² * horas * área total * eficiencia / 1000 = kWh
	const hourlyGenerationBruta =
		(radiation * 1 * totalArea * config.solarPanelEfficiency) / 1000;
	
	// Aplicar correcciones
	const hourlyGenerationCorregida = hourlyGenerationBruta * orientationTiltFactor;
	
	// Aplicar pérdidas del sistema (inversor, cableado, sombreado, suciedad, etc.)
	const hourlyGenerationNeta = hourlyGenerationCorregida * (1 - config.systemLosses);
	
	return Math.max(0, hourlyGenerationNeta); // No puede ser negativo
}

/**
 * Calcula la predicción de generación solar basada en datos meteorológicos
 */
export function calculateSolarPrediction(
	weather: WeatherForecast,
	config: SolarSystemConfig,
	latitude: number = 11
): SolarPrediction {
	const hourlyBreakdown = weather.hourly.time.map((time, index) => {
		const radiation = weather.hourly.shortwave_radiation[index] || 0;
		const solarGeneration = calculateSolarGeneration(radiation, config, latitude);
		return {
			time,
			solarGeneration,
			radiation,
		};
	});

	// Suma total diaria (primeros 24 horas válidos, asegurándonos de que existan)
	const validHours = hourlyBreakdown.slice(0, Math.min(24, hourlyBreakdown.length));
	const dailySolarGeneration = validHours.reduce((sum, hour) => {
		const value = hour.solarGeneration || 0;
		return sum + (isNaN(value) ? 0 : value);
	}, 0);

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
	pricePerKwh: number,
	config: SolarSystemConfig
): BatteryPrediction {
	const consumption = calculateConsumption(appliances, pricePerKwh);

	const dailyConsumption = consumption.dailyKwh || 0;
	const dailySolarGeneration = solarPrediction.dailySolarGeneration || 0;

	// Validar que los valores sean números válidos
	if (isNaN(dailyConsumption) || isNaN(dailySolarGeneration)) {
		return {
			dailyConsumption: 0,
			dailySolarGeneration: 0,
			dailyBatteryCharge: 0,
			batteryCapacityNeeded: 0,
			energySurplus: 0,
			energyDeficit: 0,
			autonomyDays: 0,
			solarEfficiency: 0,
		};
	}

	// Capacidad útil de baterías considerando DoD (Profundidad de Descarga)
	const batteryCapacity = Number(config.batteryCapacityKwh) || 0;
	const dod = Number(config.batteryDepthOfDischarge) || 0;
	const usableBatteryCapacity = batteryCapacity * dod;
	
	// Validar que la capacidad útil sea un número válido
	if (isNaN(usableBatteryCapacity) || usableBatteryCapacity < 0) {
		return {
			dailyConsumption,
			dailySolarGeneration,
			dailyBatteryCharge: 0,
			batteryCapacityNeeded: dailyConsumption * 1.5,
			energySurplus: Math.max(0, dailySolarGeneration - dailyConsumption),
			energyDeficit: Math.max(0, dailyConsumption - dailySolarGeneration),
			autonomyDays: 0,
			solarEfficiency: dailyConsumption > 0 ? Math.min(100, (dailySolarGeneration / dailyConsumption) * 100) : 0,
		};
	}
	
	// Energía que se puede almacenar en baterías (limitada por la capacidad útil real)
	// Considera cuánto excedente hay disponible y cuánto pueden almacenar las baterías
	const energyExcess = Math.max(0, dailySolarGeneration - dailyConsumption);
	const batteryEfficiency = Number(config.batteryEfficiency) || 0.9;
	
	// Calcular cuánto del excedente se puede almacenar (aplicando eficiencia de carga)
	const storableFromExcess = energyExcess > 0 
		? Math.min(energyExcess * batteryEfficiency, usableBatteryCapacity)
		: 0;
	
	// La energía que realmente se almacena es el mínimo entre:
	// 1. Lo que se puede almacenar del excedente
	// 2. La capacidad útil de las baterías
	const dailyBatteryCharge = Math.min(
		Math.max(0, storableFromExcess),
		Math.max(0, usableBatteryCapacity)
	);

	// Capacidad de batería necesaria (recomendación: 1.5x el consumo diario)
	const batteryCapacityNeeded = dailyConsumption * 1.5;

	// Excedente o déficit de energía
	const energySurplus = Math.max(0, dailySolarGeneration - dailyConsumption);
	const energyDeficit = Math.max(0, dailyConsumption - dailySolarGeneration);

	// Días de autonomía (cuántos días puede funcionar solo con baterías)
	// Basado en la capacidad útil de las baterías (considerando DoD)
	const autonomyDays =
		dailyConsumption > 0 && usableBatteryCapacity > 0 && !isNaN(usableBatteryCapacity) && !isNaN(dailyConsumption)
			? (usableBatteryCapacity * batteryEfficiency) / dailyConsumption
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

