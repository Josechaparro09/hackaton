import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Battery,
	Sun,
	Zap,
	TrendingUp,
	AlertCircle,
	CheckCircle2,
	RefreshCw,
	Thermometer,
	Cloud,
} from "lucide-react";
import { SolarSystemConfig as SolarSystemConfigComponent } from "@/components/SolarSystemConfig";
import { getWeatherForecast, getDepartmentCoordinates } from "@/utils/weatherService";
import { calculateSolarPrediction, calculateBatteryPrediction } from "@/utils/solarPrediction";
import { SolarSystemConfig, DEFAULT_CONFIG } from "@/components/SolarSystemConfig";
import { Appliance } from "@/types/appliance";
import { BatteryPrediction, WeatherForecast } from "@/types/weather";
import { cn } from "@/lib/utils";

interface SolarBatteryPredictionProps {
	appliances: Appliance[];
	pricePerKwh: number;
}

const DEPARTMENTS = ["La Guajira", "Cesar", "Atlántico", "Magdalena"];

export const SolarBatteryPrediction = ({
	appliances,
	pricePerKwh,
}: SolarBatteryPredictionProps) => {
	const [selectedDepartment, setSelectedDepartment] = useState<string>("La Guajira");
	const [loading, setLoading] = useState(false);
	const [prediction, setPrediction] = useState<BatteryPrediction | null>(null);
	const [weather, setWeather] = useState<WeatherForecast | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [systemConfig, setSystemConfig] = useState<SolarSystemConfig>(() => {
		const stored = localStorage.getItem("ecowatt_solar_config");
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				// Validar y migrar configuraciones antiguas
				// Corregir área si es incorrecta (configuraciones antiguas tenían 10 m² por panel)
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

	const fetchPrediction = async () => {
		if (appliances.length === 0) {
			setError("Agrega al menos un electrodoméstico para calcular la predicción");
			setPrediction(null);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const coords = getDepartmentCoordinates(selectedDepartment);
			if (!coords) {
				setError("Departamento no encontrado");
				setLoading(false);
				return;
			}

			const weatherData = await getWeatherForecast(coords.latitude, coords.longitude);
			if (!weatherData) {
				setError("No se pudieron obtener datos meteorológicos. Intenta nuevamente.");
				setLoading(false);
				return;
			}

			setWeather(weatherData);
			// Usar latitud del departamento para cálculos más precisos
			const latitude = coords.latitude;
			
			const solarPred = calculateSolarPrediction(weatherData, systemConfig, latitude);
			const batteryPred = calculateBatteryPrediction(
				appliances,
				solarPred,
				pricePerKwh,
				systemConfig
			);

			setPrediction(batteryPred);
		} catch (err) {
			setError("Error al calcular la predicción. Intenta nuevamente.");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	// Guardar configuración en localStorage (con validación)
	useEffect(() => {
		// Validar y normalizar configuración antes de guardar
		const validatedConfig: SolarSystemConfig = {
			solarPanelsCount: Math.max(1, Math.min(100, Number(systemConfig.solarPanelsCount) || 10)),
			solarPanelAreaM2: Math.max(0.5, Math.min(5, Number(systemConfig.solarPanelAreaM2) || 1.0)),
			solarPanelEfficiency: Math.max(0.1, Math.min(0.5, Number(systemConfig.solarPanelEfficiency) || 0.20)),
			batteryCapacityKwh: Math.max(0.1, Math.min(1000, Number(systemConfig.batteryCapacityKwh) || 10)),
			batteryEfficiency: Math.max(0.5, Math.min(1, Number(systemConfig.batteryEfficiency) || 0.90)),
			batteryDepthOfDischarge: Math.max(0.5, Math.min(1, Number(systemConfig.batteryDepthOfDischarge) || 0.80)),
			panelOrientation: Math.max(0, Math.min(360, Number(systemConfig.panelOrientation) || 180)),
			panelTilt: Math.max(0, Math.min(90, Number(systemConfig.panelTilt) || 10)),
			systemLosses: Math.max(0, Math.min(0.5, Number(systemConfig.systemLosses) || 0.12)),
		};
		localStorage.setItem("ecowatt_solar_config", JSON.stringify(validatedConfig));
	}, [systemConfig]);

	useEffect(() => {
		if (appliances.length > 0 && selectedDepartment) {
			fetchPrediction();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appliances, selectedDepartment, pricePerKwh, systemConfig]);

	return (
		<Card className="glass-card shadow-medium">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Sun className="h-5 w-5 text-primary" />
							Predicción Solar y Baterías
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Basado en pronóstico meteorológico de Open-Meteo
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchPrediction}
						disabled={loading || appliances.length === 0}
						className="gap-2"
					>
						<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
						Actualizar
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Configuración del Sistema */}
				<SolarSystemConfigComponent
					config={systemConfig}
					onConfigChange={setSystemConfig}
					onReset={() => setSystemConfig(DEFAULT_CONFIG)}
				/>

				{/* Selector de Departamento */}
				<div className="space-y-2">
					<Label htmlFor="department">Departamento</Label>
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

				{/* Error */}
				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Loading */}
				{loading && (
					<div className="space-y-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				)}

				{/* Predicción */}
				{prediction && !loading && (
					<>
						{/* Información del Clima Actual */}
						{weather && (
							<Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 mb-6">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
										Condiciones Climáticas Actuales - {selectedDepartment}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
											<div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
												<Thermometer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Temperatura</p>
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
										<div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
											<div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
												<Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Generación Estimada</p>
												<p className="text-2xl font-bold text-green-700 dark:text-green-400">
													{weather && (() => {
														const panelsCount = Number(systemConfig.solarPanelsCount) || 0;
														const areaPerPanel = Number(systemConfig.solarPanelAreaM2) || 0;
														// Asegurarse de que el área por panel sea razonable (corregir configuraciones antiguas)
														const correctedAreaPerPanel = areaPerPanel > 5 ? 1.0 : areaPerPanel;
														const totalArea = panelsCount * correctedAreaPerPanel;
														
														// Calcular factor de orientación/inclinación usando la misma función que los cálculos
														const optimalOrientation = 180;
														const orientation = Number(systemConfig.panelOrientation) || 180;
														const orientationDeviation = Math.abs(orientation - optimalOrientation);
														let orientationFactor = 1.0;
														if (orientationDeviation <= 30) orientationFactor = 1.0;
														else if (orientationDeviation <= 60) orientationFactor = 0.95;
														else if (orientationDeviation <= 90) orientationFactor = 0.85;
														else if (orientationDeviation <= 135) orientationFactor = 0.70;
														else orientationFactor = 0.60;
														
														const optimalTilt = Math.max(0, 11 - 10); // Latitud aproximada
														const tilt = Number(systemConfig.panelTilt) || 10;
														const tiltDeviation = Math.abs(tilt - optimalTilt);
														const tiltFactor = tiltDeviation <= 10 ? 1.0 : 
															tiltDeviation <= 20 ? 0.98 : 
															tiltDeviation <= 30 ? 0.95 : Math.max(0.85, 1 - (tiltDeviation - 30) * 0.005);
														
														const efficiency = Number(systemConfig.solarPanelEfficiency) || 0.20;
														const losses = Number(systemConfig.systemLosses) || 0.12;
														const radiation = Number(weather.current.shortwave_radiation) || 0;
														
														const generation = (radiation * totalArea * efficiency * orientationFactor * tiltFactor * (1 - losses)) / 1000;
														return isNaN(generation) || !isFinite(generation) ? "0.00" : Math.max(0, generation).toFixed(2);
													})()} kWh/h
												</p>
											</div>
										</div>
									</div>
									{weather.current.time && (
										<p className="text-xs text-muted-foreground mt-4 text-center">
											Última actualización: {new Date(weather.current.time).toLocaleString("es-CO", {
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									)}
								</CardContent>
							</Card>
						)}

						{/* Resumen Principal */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-muted-foreground">Generación Solar Diaria</p>
											<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
												{prediction.dailySolarGeneration.toFixed(2)} kWh
											</p>
										</div>
										<Sun className="h-8 w-8 text-emerald-500" />
									</div>
								</CardContent>
							</Card>

							<Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-muted-foreground">Consumo Diario</p>
											<p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
												{prediction.dailyConsumption.toFixed(2)} kWh
											</p>
										</div>
										<Zap className="h-8 w-8 text-blue-500" />
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Eficiencia y Balance */}
						<div className="space-y-4">
							<Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<p className="text-sm font-medium">Eficiencia del Sistema Solar</p>
										<Badge
											variant={prediction.solarEfficiency >= 80 ? "default" : "secondary"}
										>
											{prediction.solarEfficiency.toFixed(1)}%
										</Badge>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div
											className={cn(
												"h-2 rounded-full transition-all",
												prediction.solarEfficiency >= 80
													? "bg-emerald-500"
													: prediction.solarEfficiency >= 50
														? "bg-yellow-500"
														: "bg-red-500"
											)}
											style={{ width: `${Math.min(100, prediction.solarEfficiency)}%` }}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Balance Energético */}
							{prediction.energySurplus > 0 ? (
								<Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
									<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									<AlertDescription>
										<span className="font-semibold text-emerald-700 dark:text-emerald-400">
											Excedente de {prediction.energySurplus.toFixed(2)} kWh/día
										</span>
										<p className="text-sm text-muted-foreground mt-1">
											Tu sistema solar genera más energía de la que consumes. El excedente puede
											almacenarse en baterías o venderse a la red.
										</p>
									</AlertDescription>
								</Alert>
							) : prediction.energyDeficit > 0 ? (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										<span className="font-semibold">
											Déficit de {prediction.energyDeficit.toFixed(2)} kWh/día
										</span>
										<p className="text-sm mt-1">
											Tu consumo supera la generación solar. Considera aumentar el número de
											paneles solares o reducir el consumo.
										</p>
									</AlertDescription>
								</Alert>
							) : (
								<Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
									<CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									<AlertDescription>
										<span className="font-semibold text-blue-700 dark:text-blue-400">
											Balance perfecto
										</span>
										<p className="text-sm text-muted-foreground mt-1">
											Tu generación solar cubre exactamente tu consumo diario.
										</p>
									</AlertDescription>
								</Alert>
							)}
						</div>

						{/* Información de Baterías */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card className="border-l-4 border-l-amber-500">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<p className="text-sm text-muted-foreground">Almacenamiento Diario</p>
										<Battery className="h-5 w-5 text-amber-500" />
									</div>
									<p className="text-2xl font-bold">
										{isNaN(prediction.dailyBatteryCharge) || !isFinite(prediction.dailyBatteryCharge) 
											? "0.00" 
											: prediction.dailyBatteryCharge.toFixed(2)} kWh
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Capacidad utilizable en baterías
									</p>
								</CardContent>
							</Card>

							<Card className="border-l-4 border-l-violet-500">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<p className="text-sm text-muted-foreground">Capacidad Necesaria</p>
										<TrendingUp className="h-5 w-5 text-violet-500" />
									</div>
									<p className="text-2xl font-bold">
										{prediction.batteryCapacityNeeded.toFixed(2)} kWh
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Recomendada para sistema
									</p>
								</CardContent>
							</Card>

							<Card className="border-l-4 border-l-green-500">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<p className="text-sm text-muted-foreground">Autonomía</p>
										<Battery className="h-5 w-5 text-green-500" />
									</div>
									<p className="text-2xl font-bold">
										{prediction.autonomyDays.toFixed(1)} días
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Funcionamiento sin sol
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Información Adicional */}
						<Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-800">
							<AlertDescription className="text-xs text-muted-foreground">
								<p className="font-semibold mb-1">Nota técnica - Cálculos optimizados:</p>
								<ul className="list-disc list-inside space-y-1 ml-2">
									<li>
										<strong>Paneles:</strong> {systemConfig.solarPanelsCount} paneles ({(systemConfig.solarPanelsCount * systemConfig.solarPanelAreaM2).toFixed(1)} m²) con {(systemConfig.solarPanelEfficiency * 100).toFixed(1)}% eficiencia
									</li>
									<li>
										<strong>Orientación/Inclinación:</strong> {systemConfig.panelOrientation}° / {systemConfig.panelTilt}° - Factor de corrección aplicado
									</li>
									<li>
										<strong>Pérdidas del sistema:</strong> {(systemConfig.systemLosses * 100).toFixed(1)}% (inversor, cableado, sombreado, suciedad)
									</li>
									<li>
										<strong>Baterías:</strong> {systemConfig.batteryCapacityKwh} kWh capacidad, {(systemConfig.batteryDepthOfDischarge * 100).toFixed(0)}% DoD, {(systemConfig.batteryEfficiency * 100).toFixed(1)}% eficiencia
									</li>
									<li>
										<strong>Capacidad útil real:</strong> {(systemConfig.batteryCapacityKwh * systemConfig.batteryDepthOfDischarge).toFixed(2)} kWh (considerando DoD)
									</li>
									<li>
										<strong>Recomendación:</strong> {(prediction.dailyConsumption * 1.5).toFixed(2)} kWh (1.5x consumo diario)
									</li>
									<li>
										Datos meteorológicos: Open-Meteo API (7 días pronóstico)
									</li>
								</ul>
							</AlertDescription>
						</Alert>
					</>
				)}

				{/* Estado Inicial */}
				{!prediction && !loading && appliances.length === 0 && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Agrega electrodomésticos para ver la predicción de energía solar y baterías.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
};

