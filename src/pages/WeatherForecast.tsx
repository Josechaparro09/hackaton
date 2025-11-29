import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Cloud,
	Thermometer,
	Sun,
	Droplets,
	Wind,
	AlertCircle,
	RefreshCw,
	Zap,
	Settings,
} from "lucide-react";
import { getDailyWeatherForecast, getDepartmentCoordinates } from "@/utils/weatherService";
import { WeatherForecast } from "@/types/weather";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { SolarSystemConfig, DEFAULT_CONFIG } from "@/components/SolarSystemConfig";

const DEPARTMENTS = ["La Guajira", "Cesar", "Atlántico", "Magdalena"];

/**
 * Calcula el factor de corrección por orientación e inclinación
 */
function calculateOrientationTiltFactor(
	orientation: number,
	tilt: number,
	latitude: number
): number {
	const optimalOrientation = 180; // Sur
	const orientationDeviation = Math.abs(orientation - optimalOrientation);
	let orientationFactor = 1.0;
	
	if (orientationDeviation <= 30) {
		orientationFactor = 1.0;
	} else if (orientationDeviation <= 60) {
		orientationFactor = 0.95;
	} else if (orientationDeviation <= 90) {
		orientationFactor = 0.85;
	} else if (orientationDeviation <= 135) {
		orientationFactor = 0.70;
	} else {
		orientationFactor = 0.60;
	}
	
	const optimalTilt = Math.max(0, latitude - 10);
	const tiltDeviation = Math.abs(tilt - optimalTilt);
	let tiltFactor = 1.0;
	
	if (tiltDeviation <= 10) {
		tiltFactor = 1.0;
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
 * Calcula la generación solar diaria desde la radiación diaria (MJ/m²)
 */
function calculateDailySolarGeneration(
	radiationMJm2: number,
	config: SolarSystemConfig,
	latitude: number
): number {
	const totalArea = config.solarPanelsCount * config.solarPanelAreaM2;
	
	// Factor de corrección por orientación e inclinación
	const orientationTiltFactor = calculateOrientationTiltFactor(
		config.panelOrientation,
		config.panelTilt,
		latitude
	);
	
	// Convertir MJ/m² a kWh/m²: 1 MJ = 0.2778 kWh
	// Generación diaria = (Radiación MJ/m² * Área m² * Eficiencia * Factor orientación/inclinación * (1 - pérdidas)) * 0.2778
	const dailyGenerationKwh = 
		(radiationMJm2 * totalArea * config.solarPanelEfficiency * orientationTiltFactor * (1 - config.systemLosses)) * 0.2778;
	
	return Math.max(0, dailyGenerationKwh);
}

const WeatherForecastPage = () => {
	const [selectedDepartment, setSelectedDepartment] = useState<string>("La Guajira");
	const [loading, setLoading] = useState(false);
	const [weather, setWeather] = useState<WeatherForecast | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [systemConfig] = useState<SolarSystemConfig>(() => {
		const stored = localStorage.getItem("ecowatt_solar_config");
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				const correctedArea = parsed.solarPanelAreaM2 && parsed.solarPanelAreaM2 > 5 ? 1.0 : (parsed.solarPanelAreaM2 || DEFAULT_CONFIG.solarPanelAreaM2);
				return {
					solarPanelsCount: parsed.solarPanelsCount || DEFAULT_CONFIG.solarPanelsCount,
					solarPanelAreaM2: correctedArea,
					solarPanelEfficiency: parsed.solarPanelEfficiency || DEFAULT_CONFIG.solarPanelEfficiency,
					batteryCapacityKwh: parsed.batteryCapacityKwh || DEFAULT_CONFIG.batteryCapacityKwh,
					batteryEfficiency: parsed.batteryEfficiency || DEFAULT_CONFIG.batteryEfficiency,
					batteryDepthOfDischarge: parsed.batteryDepthOfDischarge ?? DEFAULT_CONFIG.batteryDepthOfDischarge,
					panelOrientation: parsed.panelOrientation ?? DEFAULT_CONFIG.panelOrientation,
					panelTilt: parsed.panelTilt ?? DEFAULT_CONFIG.panelTilt,
					systemLosses: parsed.systemLosses ?? DEFAULT_CONFIG.systemLosses,
				};
			} catch (e) {
				return DEFAULT_CONFIG;
			}
		}
		return DEFAULT_CONFIG;
	});

	const fetchWeather = async () => {
		setLoading(true);
		setError(null);

		try {
			const coords = getDepartmentCoordinates(selectedDepartment);
			if (!coords) {
				setError("Departamento no encontrado");
				setLoading(false);
				return;
			}

			const weatherData = await getDailyWeatherForecast(coords.latitude, coords.longitude);
			if (!weatherData) {
				setError("No se pudieron obtener datos meteorológicos. Intenta nuevamente.");
				setLoading(false);
				return;
			}

			setWeather(weatherData);
		} catch (err) {
			setError("Error al cargar las predicciones climáticas");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchWeather();
	}, [selectedDepartment]);

	const getWeatherIcon = (radiation: number, precipitation?: number) => {
		if (precipitation && precipitation > 0) {
			return <Droplets className="h-8 w-8 text-blue-500" />;
		}
		if (radiation > 15) {
			return <Sun className="h-8 w-8 text-yellow-500" />;
		}
		return <Cloud className="h-8 w-8 text-gray-500" />;
	};

	const getDayName = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.toDateString() === today.toDateString()) {
			return "Hoy";
		}
		if (date.toDateString() === tomorrow.toDateString()) {
			return "Mañana";
		}
		return format(date, "EEEE", { locale: es });
	};

	return (
		<Layout>
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				{/* Header */}
				<header className="mb-8 animate-fade-in">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-3 rounded-xl gradient-primary">
							<Cloud className="h-8 w-8 text-white" />
						</div>
						<div>
							<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
								EcoWatt
							</h1>
							<p className="text-muted-foreground">Predicciones Climáticas</p>
						</div>
					</div>
				</header>

				{/* Selector de Departamento */}
				<div className="mb-6 animate-fade-in">
					<div className="space-y-2 max-w-xs">
						<Label htmlFor="department">Selecciona un departamento</Label>
						<Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
							<SelectTrigger id="department">
								<SelectValue placeholder="Selecciona un departamento" />
							</SelectTrigger>
							<SelectContent>
								{DEPARTMENTS.map((dept) => (
									<SelectItem key={dept} value={dept}>
										{dept}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Error */}
				{error && (
					<Alert variant="destructive" className="mb-6">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Loading */}
				{loading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
						{[...Array(5)].map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className="h-6 w-24" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-32 w-full mb-4" />
									<Skeleton className="h-4 w-full mb-2" />
									<Skeleton className="h-4 w-full mb-2" />
									<Skeleton className="h-4 w-full" />
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Predicciones */}
				{weather && weather.daily && !loading && (
					<div className="space-y-6">
						{/* Clima Actual */}
						<Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Thermometer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									Condiciones Actuales - {selectedDepartment}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
										<div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
											<Thermometer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Temperatura Actual</p>
											<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
												{weather.current.temperature_2m.toFixed(1)}°C
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
										<div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
											<Sun className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Radiación Solar</p>
											<p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
												{weather.current.shortwave_radiation.toFixed(1)} W/m²
											</p>
										</div>
									</div>
								</div>
								{weather.current.time && (
									<p className="text-xs text-muted-foreground mt-4 text-center">
										Última actualización: {format(new Date(weather.current.time), "PPpp", { locale: es })}
									</p>
								)}
							</CardContent>
						</Card>

						{/* Resumen de Configuración del Sistema */}
						<Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
									Configuración del Sistema Solar
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
										<div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
											<Sun className="h-5 w-5 text-green-600 dark:text-green-400" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground mb-1">Paneles</p>
											<p className="text-lg font-bold text-green-700 dark:text-green-400">
												{systemConfig.solarPanelsCount} unidades
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
										<div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
											<Sun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground mb-1">Área Total</p>
											<p className="text-lg font-bold text-blue-700 dark:text-blue-400">
												{(systemConfig.solarPanelsCount * systemConfig.solarPanelAreaM2).toFixed(1)} m²
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
										<div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
											<Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground mb-1">Eficiencia</p>
											<p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
												{(systemConfig.solarPanelEfficiency * 100).toFixed(1)}%
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
										<div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
											<Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground mb-1">Orientación / Inclinación</p>
											<p className="text-lg font-bold text-purple-700 dark:text-purple-400">
												{systemConfig.panelOrientation}° / {systemConfig.panelTilt}°
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Predicciones de los próximos 5 días */}
						<div>
							<h2 className="text-2xl font-bold mb-4">Pronóstico para los próximos 5 días</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
								{weather.daily.time.slice(0, 5).map((date, index) => {
									const maxTemp = weather.daily?.temperature_2m_max[index] || 0;
									const minTemp = weather.daily?.temperature_2m_min[index] || 0;
									const radiation = weather.daily?.shortwave_radiation_sum[index] || 0;
									const precipitation = weather.daily?.precipitation_sum?.[index] || 0;
									const windSpeed = weather.daily?.windspeed_10m_max?.[index] || 0;
									const radiationWm2 = (radiation * 1000000) / (24 * 3600); // Convertir MJ/m² a W/m² promedio
									
									// Calcular generación solar diaria
									const coords = getDepartmentCoordinates(selectedDepartment);
									const latitude = coords?.latitude || 11;
									const dailyGeneration = calculateDailySolarGeneration(
										radiation,
										systemConfig,
										latitude
									);

									return (
										<Card key={date} className="hover:shadow-lg transition-shadow">
											<CardHeader>
												<CardTitle className="text-lg">
													{getDayName(date)}
												</CardTitle>
												<p className="text-sm text-muted-foreground">
													{format(new Date(date), "d 'de' MMMM", { locale: es })}
												</p>
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Icono del clima */}
												<div className="flex justify-center">
													{getWeatherIcon(radiationWm2, precipitation)}
												</div>

												{/* Temperaturas */}
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<Thermometer className="h-4 w-4 text-red-500" />
															<span className="text-sm text-muted-foreground">Máx</span>
														</div>
														<span className="text-lg font-bold text-red-600 dark:text-red-400">
															{maxTemp.toFixed(1)}°C
														</span>
													</div>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<Thermometer className="h-4 w-4 text-blue-500" />
															<span className="text-sm text-muted-foreground">Mín</span>
														</div>
														<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
															{minTemp.toFixed(1)}°C
														</span>
													</div>
												</div>

												{/* Radiación Solar */}
												<div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
													<div className="flex items-center gap-2">
														<Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
														<span className="text-sm text-muted-foreground">Radiación</span>
													</div>
													<span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
														{radiation.toFixed(1)} MJ/m²
													</span>
												</div>

												{/* Predicción de Generación Solar */}
												<div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
													<div className="flex items-center gap-2 mb-2">
														<Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
														<span className="text-sm font-medium text-green-700 dark:text-green-400">
															Posible Energía Generada el {format(new Date(date), "d 'de' MMMM", { locale: es })}
														</span>
													</div>
													<div className="text-right">
														<span className="text-lg font-bold text-green-700 dark:text-green-400">
															{dailyGeneration.toFixed(2)} kWh
														</span>
													</div>
												</div>

												{/* Precipitación */}
												{precipitation > 0 && (
													<div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
														<div className="flex items-center gap-2">
															<Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
															<span className="text-sm text-muted-foreground">Lluvia</span>
														</div>
														<span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
															{precipitation.toFixed(1)} mm
														</span>
													</div>
												)}

												{/* Viento */}
												{windSpeed > 0 && (
													<div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
														<div className="flex items-center gap-2">
															<Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />
															<span className="text-sm text-muted-foreground">Viento</span>
														</div>
														<span className="text-sm font-semibold text-gray-700 dark:text-gray-400">
															{windSpeed.toFixed(1)} km/h
														</span>
													</div>
												)}
											</CardContent>
										</Card>
									);
								})}
							</div>
							
							{/* Resumen Total de Energía Generada */}
							{weather.daily && weather.daily.time.length > 0 && (
								<Card className="mt-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
											Resumen de Generación Solar (5 días)
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
												<div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
													<Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
												</div>
												<div>
													<p className="text-sm text-muted-foreground">Total Generado (5 días)</p>
													<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
														{(() => {
															const coords = getDepartmentCoordinates(selectedDepartment);
															const latitude = coords?.latitude || 11;
															const total = weather.daily.time.slice(0, 5).reduce((sum, _, index) => {
																const radiation = weather.daily?.shortwave_radiation_sum[index] || 0;
																return sum + calculateDailySolarGeneration(radiation, systemConfig, latitude);
															}, 0);
															return total.toFixed(2);
														})()} kWh
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
												<div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
													<Sun className="h-6 w-6 text-blue-600 dark:text-blue-400" />
												</div>
												<div>
													<p className="text-sm text-muted-foreground">Promedio Diario</p>
													<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
														{(() => {
															const coords = getDepartmentCoordinates(selectedDepartment);
															const latitude = coords?.latitude || 11;
															const total = weather.daily.time.slice(0, 5).reduce((sum, _, index) => {
																const radiation = weather.daily?.shortwave_radiation_sum[index] || 0;
																return sum + calculateDailySolarGeneration(radiation, systemConfig, latitude);
															}, 0);
															return (total / 5).toFixed(2);
														})()} kWh/día
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
												<div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
													<Thermometer className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
												</div>
												<div>
													<p className="text-sm text-muted-foreground">Radiación Promedio</p>
													<p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
														{(() => {
															const avg = weather.daily.time.slice(0, 5).reduce((sum, _, index) => {
																return sum + (weather.daily?.shortwave_radiation_sum[index] || 0);
															}, 0) / 5;
															return avg.toFixed(1);
														})()} MJ/m²
													</p>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Botón de actualizar */}
						<div className="flex justify-center">
							<button
								onClick={fetchWeather}
								disabled={loading}
								className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
								Actualizar predicciones
							</button>
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
};

export default WeatherForecastPage;

