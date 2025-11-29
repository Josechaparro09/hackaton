import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarProductionData } from "@/types/solarProduction";
import { Map as MapIcon, TrendingUp, ZoomIn, ZoomOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SolarProductionMapProps {
	data: SolarProductionData[];
	onDepartmentClick?: (department: string) => void;
}

const COLORS = {
	"La Guajira": "#f59e0b",
	"Cesar": "#3b82f6",
	"Atlántico": "#10b981",
	"Magdalena": "#8b5cf6",
};

// Coordenadas proyectadas para el mapa SVG (x, y en píxeles)
// Estas son posiciones relativas en el SVG para los departamentos del Caribe
const departmentPositions: Record<string, { x: number; y: number; labelX: number; labelY: number }> = {
	"La Guajira": { x: 120, y: 60, labelX: 120, labelY: 40 },
	"Cesar": { x: 180, y: 180, labelX: 180, labelY: 160 },
	"Atlántico": { x: 320, y: 220, labelX: 320, labelY: 240 },
	"Magdalena": { x: 280, y: 180, labelX: 280, labelY: 200 },
};

export const SolarProductionMap = ({ data, onDepartmentClick }: SolarProductionMapProps) => {
	const [hoveredDept, setHoveredDept] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	// Calcular estadísticas por departamento
	const departmentStats = useMemo(() => {
		const stats = new Map<string, { total: number; promedio: number; count: number }>();
		
		data.forEach((item) => {
			const existing = stats.get(item.departamento) || { total: 0, promedio: 0, count: 0 };
			stats.set(item.departamento, {
				total: existing.total + item.produccion_mwh,
				promedio: 0,
				count: existing.count + 1,
			});
		});

		// Calcular promedios
		stats.forEach((stat, dept) => {
			stat.promedio = stat.total / stat.count;
		});

		return stats;
	}, [data]);

	// Normalizar valores para tamaño de marcadores (0-1)
	const getMarkerSize = (promedio: number): number => {
		const maxPromedio = Math.max(...Array.from(departmentStats.values()).map(s => s.promedio));
		const minPromedio = Math.min(...Array.from(departmentStats.values()).map(s => s.promedio));
		if (maxPromedio === minPromedio) return 0.5;
		return 0.3 + ((promedio - minPromedio) / (maxPromedio - minPromedio)) * 0.7;
	};

	// Obtener posición del marcador
	const getMarkerPosition = (department: string) => {
		return departmentPositions[department] || { x: 250, y: 150, labelX: 250, labelY: 130 };
	};

	const markers = useMemo(() => {
		return Array.from(departmentStats.entries()).map(([dept, stats]) => ({
			department: dept,
			position: getMarkerPosition(dept),
			stats,
			size: getMarkerSize(stats.promedio),
			color: COLORS[dept as keyof typeof COLORS] || "#6b7280",
		}));
	}, [departmentStats]);

	const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
	const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
	const handleReset = () => {
		setZoom(1);
		setPan({ x: 0, y: 0 });
	};

	const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
		if (e.button !== 0) return; // Solo botón izquierdo
		setIsDragging(true);
		setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
		e.preventDefault();
	};

	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
		if (isDragging) {
			setPan({
				x: e.clientX - dragStart.x,
				y: e.clientY - dragStart.y,
			});
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	return (
		<Card className="glass-card shadow-medium">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapIcon className="h-5 w-5 text-primary" />
					Mapa de Producción Solar por Departamento
				</CardTitle>
			</CardHeader>
			<CardContent>
				<TooltipProvider>
					<div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border/50 bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-green-50/50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-green-950/20">
						{/* Controles de zoom */}
						<div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={handleZoomIn}
								className="h-8 w-8 bg-background/80 backdrop-blur-sm"
							>
								<ZoomIn className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={handleZoomOut}
								className="h-8 w-8 bg-background/80 backdrop-blur-sm"
							>
								<ZoomOut className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={handleReset}
								className="h-8 w-8 bg-background/80 backdrop-blur-sm text-xs"
							>
								⌂
							</Button>
						</div>

						{/* Mapa SVG */}
						<svg
							width="100%"
							height="100%"
							viewBox="0 0 500 300"
							preserveAspectRatio="xMidYMid meet"
							className={cn(
								"w-full h-full transition-transform duration-200",
								isDragging ? "cursor-grabbing" : "cursor-grab"
							)}
							style={{
								transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
								transformOrigin: "center center",
							}}
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
						>
							{/* Fondo con patrón */}
							<defs>
								<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
									<path
										d="M 20 0 L 0 0 0 20"
										fill="none"
										stroke="currentColor"
										strokeWidth="0.5"
										opacity="0.1"
									/>
								</pattern>
								<filter id="glow">
									<feGaussianBlur stdDeviation="3" result="coloredBlur" />
									<feMerge>
										<feMergeNode in="coloredBlur" />
										<feMergeNode in="SourceGraphic" />
									</feMerge>
								</filter>
							</defs>

							<rect width="500" height="300" fill="url(#grid)" className="text-border" />

							{/* Líneas de conexión entre departamentos (opcional, para contexto) */}
							{markers.map((marker, idx) => {
								if (idx === markers.length - 1) return null;
								const nextMarker = markers[idx + 1];
								return (
									<line
										key={`line-${idx}`}
										x1={marker.position.x}
										y1={marker.position.y}
										x2={nextMarker.position.x}
										y2={nextMarker.position.y}
										stroke="currentColor"
										strokeWidth="1"
										opacity="0.1"
										strokeDasharray="4 4"
									/>
								);
							})}

							{/* Marcadores */}
							{markers.map((marker) => (
								<g key={marker.department}>
									<Tooltip>
										<TooltipTrigger asChild>
											<g
												onClick={() => onDepartmentClick?.(marker.department)}
												onMouseEnter={() => setHoveredDept(marker.department)}
												onMouseLeave={() => setHoveredDept(null)}
												className="cursor-pointer transition-all duration-200"
												style={{
													transform: hoveredDept === marker.department ? "scale(1.2)" : "scale(1)",
													transformOrigin: `${marker.position.x}px ${marker.position.y}px`,
												}}
											>
												{/* Anillo exterior animado */}
												{hoveredDept === marker.department && (
													<circle
														cx={marker.position.x}
														cy={marker.position.y}
														r={marker.size * 20}
														fill="none"
														stroke={marker.color}
														strokeWidth="2"
														opacity="0.3"
														className="animate-ping"
													/>
												)}
												
												{/* Círculo principal */}
												<circle
													cx={marker.position.x}
													cy={marker.position.y}
													r={marker.size * 12}
													fill={marker.color}
													stroke="white"
													strokeWidth="3"
													opacity={hoveredDept === marker.department ? 0.95 : 0.85}
													filter="url(#glow)"
													className="drop-shadow-xl"
												/>
												
												{/* Círculo interior */}
												<circle
													cx={marker.position.x}
													cy={marker.position.y}
													r={marker.size * 6}
													fill="white"
													opacity="0.9"
												/>

												{/* Icono de pin SVG */}
												<path
													d={`M ${marker.position.x} ${marker.position.y + marker.size * 8} L ${marker.position.x - marker.size * 3} ${marker.position.y + marker.size * 12} L ${marker.position.x + marker.size * 3} ${marker.position.y + marker.size * 12} Z`}
													fill={marker.color}
													opacity="0.8"
													stroke="white"
													strokeWidth="2"
												/>
											</g>
										</TooltipTrigger>
										<TooltipContent side="top" className="bg-background border border-border shadow-xl">
											<div className="space-y-2">
												<p className="font-semibold text-sm">{marker.department}</p>
												<div className="flex items-center gap-2 text-xs">
													<TrendingUp className="h-3 w-3 text-muted-foreground" />
													<span>Promedio: <strong>{marker.stats.promedio.toFixed(1)} MWh</strong></span>
												</div>
												<p className="text-xs text-muted-foreground">
													Total: {marker.stats.total.toFixed(0)} MWh
												</p>
												<p className="text-xs text-muted-foreground pt-1 border-t border-border">
													👆 Click para filtrar
												</p>
											</div>
										</TooltipContent>
									</Tooltip>

									{/* Etiqueta del departamento */}
									<text
										x={marker.position.labelX}
										y={marker.position.labelY}
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill={marker.color}
										className="pointer-events-none select-none"
										opacity={hoveredDept === marker.department ? 1 : 0.7}
									>
										{marker.department}
									</text>
								</g>
							))}
						</svg>
					</div>
				</TooltipProvider>

				{/* Leyenda */}
				<div className="mt-4 p-4 bg-muted/50 rounded-lg">
					<p className="text-sm font-medium mb-3">Leyenda</p>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{markers.map((marker) => (
							<div key={marker.department} className="flex items-center gap-2">
								<div
									className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
									style={{ backgroundColor: marker.color }}
								/>
								<div>
									<p className="text-xs font-medium">{marker.department}</p>
									<p className="text-xs text-muted-foreground">
										{marker.stats.promedio.toFixed(1)} MWh
									</p>
								</div>
							</div>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-3">
						💡 Haz click en los marcadores para filtrar por departamento
					</p>
				</div>
			</CardContent>
		</Card>
	);
};

