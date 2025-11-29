import { WeatherForecast, DepartmentCoordinates } from "@/types/weather";

// Coordenadas de los departamentos colombianos del Caribe
export const DEPARTMENT_COORDINATES: DepartmentCoordinates[] = [
	{ name: "La Guajira", latitude: 11.3548, longitude: -72.5205 },
	{ name: "Cesar", latitude: 10.0736, longitude: -73.2669 },
	{ name: "Atlántico", latitude: 10.9639, longitude: -74.7964 },
	{ name: "Magdalena", latitude: 10.4116, longitude: -74.4057 },
];

/**
 * Obtiene el pronóstico del clima de Open-Meteo API
 */
export async function getWeatherForecast(
	latitude: number,
	longitude: number
): Promise<WeatherForecast | null> {
	try {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.append("latitude", latitude.toString());
		url.searchParams.append("longitude", longitude.toString());
		url.searchParams.append("current", "shortwave_radiation,temperature_2m");
		url.searchParams.append("hourly", "shortwave_radiation,temperature_2m");
		url.searchParams.append("forecast_days", "7");
		url.searchParams.append("timezone", "America/Bogota");

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error("Error al obtener datos meteorológicos");
		}

		const data = await response.json();
		return {
			current: {
				time: data.current.time,
				shortwave_radiation: data.current.shortwave_radiation || 0,
				temperature_2m: data.current.temperature_2m || 0,
			},
			hourly: {
				time: data.hourly.time || [],
				shortwave_radiation: data.hourly.shortwave_radiation || [],
				temperature_2m: data.hourly.temperature_2m || [],
			},
		};
	} catch (error) {
		console.error("Error fetching weather data:", error);
		return null;
	}
}

/**
 * Obtiene el pronóstico diario del clima de Open-Meteo API (próximos 5 días)
 */
export async function getDailyWeatherForecast(
	latitude: number,
	longitude: number
): Promise<WeatherForecast | null> {
	try {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.append("latitude", latitude.toString());
		url.searchParams.append("longitude", longitude.toString());
		url.searchParams.append("current", "shortwave_radiation,temperature_2m");
		url.searchParams.append("daily", "temperature_2m_max,temperature_2m_min,shortwave_radiation_sum,precipitation_sum,windspeed_10m_max");
		url.searchParams.append("forecast_days", "5");
		url.searchParams.append("timezone", "America/Bogota");

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error("Error al obtener datos meteorológicos");
		}

		const data = await response.json();
		return {
			current: {
				time: data.current.time,
				shortwave_radiation: data.current.shortwave_radiation || 0,
				temperature_2m: data.current.temperature_2m || 0,
			},
			hourly: {
				time: [],
				shortwave_radiation: [],
				temperature_2m: [],
			},
			daily: {
				time: data.daily?.time || [],
				temperature_2m_max: data.daily?.temperature_2m_max || [],
				temperature_2m_min: data.daily?.temperature_2m_min || [],
				shortwave_radiation_sum: data.daily?.shortwave_radiation_sum || [],
				precipitation_sum: data.daily?.precipitation_sum || [],
				windspeed_10m_max: data.daily?.windspeed_10m_max || [],
			},
		};
	} catch (error) {
		console.error("Error fetching daily weather data:", error);
		return null;
	}
}

/**
 * Obtiene coordenadas de un departamento por nombre
 */
export function getDepartmentCoordinates(
	departmentName: string
): DepartmentCoordinates | null {
	const dept = DEPARTMENT_COORDINATES.find(
		(d) => d.name.toLowerCase() === departmentName.toLowerCase()
	);
	return dept || null;
}

