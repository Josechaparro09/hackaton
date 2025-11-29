export interface WeatherForecast {
	current: {
		time: string;
		shortwave_radiation: number; // W/m²
		temperature_2m: number;
	};
	hourly: {
		time: string[];
		shortwave_radiation: number[]; // W/m² por hora
		temperature_2m: number[];
	};
	daily?: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		shortwave_radiation_sum: number[]; // MJ/m² por día
		precipitation_sum?: number[];
		windspeed_10m_max?: number[];
	};
}

export interface SolarPrediction {
	dailySolarGeneration: number; // kWh generados por día
	monthlySolarGeneration: number; // kWh generados por mes
	yearlySolarGeneration: number; // kWh generados por año
	hourlyBreakdown: Array<{
		time: string;
		solarGeneration: number; // kWh
		radiation: number; // W/m²
	}>;
}

export interface BatteryPrediction {
	dailyConsumption: number; // kWh consumidos
	dailySolarGeneration: number; // kWh generados
	dailyBatteryCharge: number; // kWh que se pueden almacenar
	batteryCapacityNeeded: number; // kWh de capacidad de batería necesaria
	energySurplus: number; // kWh excedente (si hay)
	energyDeficit: number; // kWh faltante (si hay)
	autonomyDays: number; // días de autonomía con baterías
	solarEfficiency: number; // eficiencia del sistema solar (%)
}

export interface DepartmentCoordinates {
	name: string;
	latitude: number;
	longitude: number;
}

