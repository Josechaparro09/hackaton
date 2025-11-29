import { Link } from "react-router-dom";
import { SolarProductionTable } from "@/components/SolarProductionTable";
import { SolarProductionData } from "@/types/solarProduction";
import { Button } from "@/components/ui/button";
import { Sun, Zap, ArrowLeft } from "lucide-react";

// Datos de ejemplo - aquí puedes conectar con tu API o backend
const sampleData: SolarProductionData[] = [
	{ mes: "Enero", departamento: "Arequipa", produccion_mwh: 345 },
	{ mes: "Enero", departamento: "Lima", produccion_mwh: 320 },
	{ mes: "Enero", departamento: "Moquegua", produccion_mwh: 355 },
	{ mes: "Febrero", departamento: "Arequipa", produccion_mwh: 340 },
	{ mes: "Febrero", departamento: "Lima", produccion_mwh: 315 },
	{ mes: "Febrero", departamento: "Moquegua", produccion_mwh: 348 },
	{ mes: "Marzo", departamento: "Arequipa", produccion_mwh: 335 },
	{ mes: "Marzo", departamento: "Lima", produccion_mwh: 310 },
	{ mes: "Marzo", departamento: "Moquegua", produccion_mwh: 342 },
	{ mes: "Abril", departamento: "Arequipa", produccion_mwh: 325 },
	{ mes: "Abril", departamento: "Lima", produccion_mwh: 305 },
	{ mes: "Abril", departamento: "Moquegua", produccion_mwh: 330 },
	{ mes: "Mayo", departamento: "Arequipa", produccion_mwh: 310 },
	{ mes: "Mayo", departamento: "Lima", produccion_mwh: 295 },
	{ mes: "Mayo", departamento: "Moquegua", produccion_mwh: 318 },
	{ mes: "Junio", departamento: "Arequipa", produccion_mwh: 305 },
	{ mes: "Junio", departamento: "Lima", produccion_mwh: 290 },
	{ mes: "Junio", departamento: "Moquegua", produccion_mwh: 312 },
];

const SolarProduction = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				{/* Header */}
				<header className="mb-8 animate-fade-in">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-3">
							<div className="p-3 rounded-xl gradient-primary">
								<Sun className="h-8 w-8 text-white" />
							</div>
							<div>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
									EcoWatt
								</h1>
								<p className="text-muted-foreground">Producción Solar Mensual</p>
							</div>
						</div>
						<Link to="/">
							<Button variant="outline" className="gap-2">
								<ArrowLeft className="h-4 w-4" />
								Consumo Eléctrico
							</Button>
						</Link>
					</div>
				</header>

				{/* Tabla de Producción Solar */}
				<div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
					<SolarProductionTable data={sampleData} />
				</div>
			</div>
		</div>
	);
};

export default SolarProduction;

