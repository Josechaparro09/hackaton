import { Link } from "react-router-dom";
import { SolarProductionTable } from "@/components/SolarProductionTable";
import { SolarProductionData } from "@/types/solarProduction";
import { Button } from "@/components/ui/button";
import { Sun, ArrowLeft } from "lucide-react";

// Datos de ejemplo - departamentos de la región Caribe colombiana
const sampleData: SolarProductionData[] = [
	{ mes: "Enero", departamento: "La Guajira", produccion_mwh: 365 },
	{ mes: "Enero", departamento: "Cesar", produccion_mwh: 325 },
	{ mes: "Enero", departamento: "Atlántico", produccion_mwh: 315 },
	{ mes: "Enero", departamento: "Magdalena", produccion_mwh: 330 },
	{ mes: "Febrero", departamento: "La Guajira", produccion_mwh: 358 },
	{ mes: "Febrero", departamento: "Cesar", produccion_mwh: 320 },
	{ mes: "Febrero", departamento: "Atlántico", produccion_mwh: 310 },
	{ mes: "Febrero", departamento: "Magdalena", produccion_mwh: 325 },
	{ mes: "Marzo", departamento: "La Guajira", produccion_mwh: 370 },
	{ mes: "Marzo", departamento: "Cesar", produccion_mwh: 335 },
	{ mes: "Marzo", departamento: "Atlántico", produccion_mwh: 320 },
	{ mes: "Marzo", departamento: "Magdalena", produccion_mwh: 340 },
	{ mes: "Abril", departamento: "La Guajira", produccion_mwh: 350 },
	{ mes: "Abril", departamento: "Cesar", produccion_mwh: 315 },
	{ mes: "Abril", departamento: "Atlántico", produccion_mwh: 305 },
	{ mes: "Abril", departamento: "Magdalena", produccion_mwh: 320 },
	{ mes: "Mayo", departamento: "La Guajira", produccion_mwh: 345 },
	{ mes: "Mayo", departamento: "Cesar", produccion_mwh: 310 },
	{ mes: "Mayo", departamento: "Atlántico", produccion_mwh: 298 },
	{ mes: "Mayo", departamento: "Magdalena", produccion_mwh: 315 },
	{ mes: "Junio", departamento: "La Guajira", produccion_mwh: 342 },
	{ mes: "Junio", departamento: "Cesar", produccion_mwh: 308 },
	{ mes: "Junio", departamento: "Atlántico", produccion_mwh: 295 },
	{ mes: "Junio", departamento: "Magdalena", produccion_mwh: 310 },
	{ mes: "Julio", departamento: "La Guajira", produccion_mwh: 355 },
	{ mes: "Julio", departamento: "Cesar", produccion_mwh: 318 },
	{ mes: "Julio", departamento: "Atlántico", produccion_mwh: 308 },
	{ mes: "Julio", departamento: "Magdalena", produccion_mwh: 322 },
	{ mes: "Agosto", departamento: "La Guajira", produccion_mwh: 360 },
	{ mes: "Agosto", departamento: "Cesar", produccion_mwh: 322 },
	{ mes: "Agosto", departamento: "Atlántico", produccion_mwh: 312 },
	{ mes: "Agosto", departamento: "Magdalena", produccion_mwh: 328 },
	{ mes: "Septiembre", departamento: "La Guajira", produccion_mwh: 352 },
	{ mes: "Septiembre", departamento: "Cesar", produccion_mwh: 316 },
	{ mes: "Septiembre", departamento: "Atlántico", produccion_mwh: 306 },
	{ mes: "Septiembre", departamento: "Magdalena", produccion_mwh: 318 },
	{ mes: "Octubre", departamento: "La Guajira", produccion_mwh: 348 },
	{ mes: "Octubre", departamento: "Cesar", produccion_mwh: 312 },
	{ mes: "Octubre", departamento: "Atlántico", produccion_mwh: 302 },
	{ mes: "Octubre", departamento: "Magdalena", produccion_mwh: 315 },
	{ mes: "Noviembre", departamento: "La Guajira", produccion_mwh: 355 },
	{ mes: "Noviembre", departamento: "Cesar", produccion_mwh: 318 },
	{ mes: "Noviembre", departamento: "Atlántico", produccion_mwh: 308 },
	{ mes: "Noviembre", departamento: "Magdalena", produccion_mwh: 320 },
	{ mes: "Diciembre", departamento: "La Guajira", produccion_mwh: 368 },
	{ mes: "Diciembre", departamento: "Cesar", produccion_mwh: 328 },
	{ mes: "Diciembre", departamento: "Atlántico", produccion_mwh: 318 },
	{ mes: "Diciembre", departamento: "Magdalena", produccion_mwh: 332 },
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

