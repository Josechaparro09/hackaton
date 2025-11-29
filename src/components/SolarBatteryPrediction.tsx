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
} from "lucide-react";
import { getWeatherForecast, getDepartmentCoordinates } from "@/utils/weatherService";
import { calculateSolarPrediction, calculateBatteryPrediction } from "@/utils/solarPrediction";
import { Appliance } from "@/types/appliance";
import { BatteryPrediction } from "@/types/weather";
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
	const [error, setError] = useState<string | null>(null);

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

			const weather = await getWeatherForecast(coords.latitude, coords.longitude);
			if (!weather) {
				setError("No se pudieron obtener datos meteorológicos. Intenta nuevamente.");
				setLoading(false);
				return;
			}

			const solarPred = calculateSolarPrediction(weather);
			const batteryPred = calculateBatteryPrediction(
				appliances,
				solarPred,
				pricePerKwh
			);

			setPrediction(batteryPred);
		} catch (err) {
			setError("Error al calcular la predicción. Intenta nuevamente.");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (appliances.length > 0 && selectedDepartment) {
			fetchPrediction();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appliances, selectedDepartment, pricePerKwh]);

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
										{prediction.dailyBatteryCharge.toFixed(2)} kWh
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
								<p className="font-semibold mb-1">Nota técnica:</p>
								<ul className="list-disc list-inside space-y-1 ml-2">
									<li>
										Cálculo basado en 10 m² de paneles solares con 20% de eficiencia
									</li>
									<li>
										Eficiencia de baterías: 90% (carga/descarga)
									</li>
									<li>
										Capacidad recomendada de baterías: 1.5x el consumo diario
									</li>
									<li>
										Datos meteorológicos obtenidos de Open-Meteo API (7 días de pronóstico)
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

