import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Settings, Sun, Battery, RotateCcw } from "lucide-react";

export interface SolarSystemConfig {
	solarPanelsCount: number;
	solarPanelAreaM2: number;
	solarPanelEfficiency: number; // 0-1 (ej: 0.20 = 20%)
	batteryCapacityKwh: number;
	batteryEfficiency: number; // 0-1 (ej: 0.90 = 90%)
	batteryDepthOfDischarge: number; // 0-1 (ej: 0.80 = 80% DoD para litio)
	panelOrientation: number; // Grados desde el Norte (0-360)
	panelTilt: number; // Grados de inclinación (0-90)
	systemLosses: number; // 0-1 (ej: 0.10 = 10% pérdidas totales)
}

interface SolarSystemConfigProps {
	config: SolarSystemConfig;
	onConfigChange: (config: SolarSystemConfig) => void;
	onReset: () => void;
}

const DEFAULT_CONFIG: SolarSystemConfig = {
	solarPanelsCount: 10,
	solarPanelAreaM2: 1.0,
	solarPanelEfficiency: 0.20,
	batteryCapacityKwh: 10,
	batteryEfficiency: 0.90,
	batteryDepthOfDischarge: 0.80, // 80% para baterías de litio
	panelOrientation: 180, // 180° = Sur (óptimo para Colombia)
	panelTilt: 10, // 10° inclinación (cercano a la latitud)
	systemLosses: 0.12, // 12% pérdidas totales (inversor, cableado, etc.)
};

export const SolarSystemConfig = ({
	config,
	onConfigChange,
	onReset,
}: SolarSystemConfigProps) => {
	const handleChange = (field: keyof SolarSystemConfig, value: number) => {
		onConfigChange({
			...config,
			[field]: value,
		});
	};

	const totalPanelArea = config.solarPanelsCount * config.solarPanelAreaM2;

	return (
		<Card className="glass-card shadow-medium">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5 text-primary" />
							Configuración del Sistema Solar
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Personaliza tu instalación solar para simulaciones precisas
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={onReset} className="gap-2">
						<RotateCcw className="h-4 w-4" />
						Restaurar
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Paneles Solares */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 mb-3">
						<Sun className="h-5 w-5 text-yellow-500" />
						<h3 className="font-semibold">Paneles Solares</h3>
					</div>

					<div className="space-y-3">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="panels">Cantidad de Paneles</Label>
								<Badge variant="secondary">{config.solarPanelsCount}</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="panels"
									min={1}
									max={50}
									step={1}
									value={[config.solarPanelsCount]}
									onValueChange={(value) => handleChange("solarPanelsCount", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={1}
									max={100}
									value={config.solarPanelsCount}
									onChange={(e) =>
										handleChange("solarPanelsCount", parseInt(e.target.value) || 1)
									}
									className="w-20"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="area">Área por Panel (m²)</Label>
								<Badge variant="outline">{config.solarPanelAreaM2} m²</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="area"
									min={1}
									max={5}
									step={0.1}
									value={[config.solarPanelAreaM2]}
									onValueChange={(value) => handleChange("solarPanelAreaM2", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={1}
									max={10}
									step={0.1}
									value={config.solarPanelAreaM2}
									onChange={(e) =>
										handleChange("solarPanelAreaM2", parseFloat(e.target.value) || 1)
									}
									className="w-20"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Área total: {totalPanelArea.toFixed(1)} m²
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="efficiency">Eficiencia del Panel (%)</Label>
								<Badge variant="outline">{(config.solarPanelEfficiency * 100).toFixed(1)}%</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="efficiency"
									min={0.15}
									max={0.25}
									step={0.01}
									value={[config.solarPanelEfficiency]}
									onValueChange={(value) => handleChange("solarPanelEfficiency", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={15}
									max={25}
									step={0.1}
									value={(config.solarPanelEfficiency * 100).toFixed(1)}
									onChange={(e) =>
										handleChange(
											"solarPanelEfficiency",
											(parseFloat(e.target.value) || 20) / 100
										)
									}
									className="w-20"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								15% (estándar) - 25% (alta eficiencia)
							</p>
						</div>
					</div>
				</div>

				{/* Separador */}
				<div className="border-t"></div>

				{/* Configuración de Instalación */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 mb-3">
						<Settings className="h-5 w-5 text-purple-500" />
						<h3 className="font-semibold">Instalación de Paneles</h3>
					</div>

					<div className="space-y-3">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="orientation">Orientación (grados desde Norte)</Label>
								<Badge variant="outline">{config.panelOrientation}°</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="orientation"
									min={0}
									max={360}
									step={5}
									value={[config.panelOrientation]}
									onValueChange={(value) => handleChange("panelOrientation", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={0}
									max={360}
									value={config.panelOrientation}
									onChange={(e) =>
										handleChange("panelOrientation", parseInt(e.target.value) || 180)
									}
									className="w-24"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="tilt">Inclinación (grados)</Label>
								<Badge variant="outline">{config.panelTilt}°</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="tilt"
									min={0}
									max={90}
									step={5}
									value={[config.panelTilt]}
									onValueChange={(value) => handleChange("panelTilt", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={0}
									max={90}
									value={config.panelTilt}
									onChange={(e) =>
										handleChange("panelTilt", parseInt(e.target.value) || 10)
									}
									className="w-20"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="losses">Pérdidas del Sistema (%)</Label>
								<Badge variant="outline">{(config.systemLosses * 100).toFixed(1)}%</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="losses"
									min={0.05}
									max={0.20}
									step={0.01}
									value={[config.systemLosses]}
									onValueChange={(value) => handleChange("systemLosses", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={5}
									max={20}
									step={0.1}
									value={(config.systemLosses * 100).toFixed(1)}
									onChange={(e) =>
										handleChange(
											"systemLosses",
											(parseFloat(e.target.value) || 12) / 100
										)
									}
									className="w-20"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Separador */}
				<div className="border-t"></div>

				{/* Baterías */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 mb-3">
						<Battery className="h-5 w-5 text-green-500" />
						<h3 className="font-semibold">Sistema de Baterías</h3>
					</div>

					<div className="space-y-3">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="battery">Capacidad de Baterías (kWh)</Label>
								<Badge variant="secondary">{config.batteryCapacityKwh} kWh</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="battery"
									min={1}
									max={100}
									step={1}
									value={[config.batteryCapacityKwh]}
									onValueChange={(value) => handleChange("batteryCapacityKwh", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={1}
									max={200}
									value={config.batteryCapacityKwh}
									onChange={(e) =>
										handleChange("batteryCapacityKwh", parseFloat(e.target.value) || 1)
									}
									className="w-24"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="batteryEfficiency">Eficiencia de Baterías (%)</Label>
								<Badge variant="outline">{(config.batteryEfficiency * 100).toFixed(1)}%</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="batteryEfficiency"
									min={0.80}
									max={0.95}
									step={0.01}
									value={[config.batteryEfficiency]}
									onValueChange={(value) => handleChange("batteryEfficiency", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={80}
									max={95}
									step={0.1}
									value={(config.batteryEfficiency * 100).toFixed(1)}
									onChange={(e) =>
										handleChange(
											"batteryEfficiency",
											(parseFloat(e.target.value) || 90) / 100
										)
									}
									className="w-20"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Eficiencia de carga/descarga (80% - 95%)
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="dod">Profundidad de Descarga - DoD (%)</Label>
								<Badge variant="outline">{(config.batteryDepthOfDischarge * 100).toFixed(0)}%</Badge>
							</div>
							<div className="flex items-center gap-4">
								<Slider
									id="dod"
									min={0.50}
									max={0.95}
									step={0.05}
									value={[config.batteryDepthOfDischarge]}
									onValueChange={(value) => handleChange("batteryDepthOfDischarge", value[0])}
									className="flex-1"
								/>
								<Input
									type="number"
									min={50}
									max={95}
									step={5}
									value={(config.batteryDepthOfDischarge * 100).toFixed(0)}
									onChange={(e) =>
										handleChange(
											"batteryDepthOfDischarge",
											(parseInt(e.target.value) || 80) / 100
										)
									}
									className="w-20"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Litio: 80-90%, Plomo-ácido: 50%, Gel: 60%
							</p>
						</div>
					</div>
				</div>

				{/* Resumen */}
				<div className="p-4 bg-muted/50 rounded-lg space-y-2">
					<p className="text-sm font-semibold">Resumen de la Configuración:</p>
					<ul className="text-xs text-muted-foreground space-y-1">
						<li>
							• {config.solarPanelsCount} paneles solares ({totalPanelArea.toFixed(1)} m² total)
						</li>
						<li>
							• Eficiencia de paneles: {(config.solarPanelEfficiency * 100).toFixed(1)}%
						</li>
						<li>
							• Orientación: {config.panelOrientation}°, Inclinación: {config.panelTilt}°
						</li>
						<li>
							• Pérdidas del sistema: {(config.systemLosses * 100).toFixed(1)}%
						</li>
						<li>
							• Capacidad de baterías: {config.batteryCapacityKwh} kWh (DoD: {(config.batteryDepthOfDischarge * 100).toFixed(0)}%)
						</li>
						<li>
							• Eficiencia de baterías: {(config.batteryEfficiency * 100).toFixed(1)}%
						</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	);
};

export { DEFAULT_CONFIG };

