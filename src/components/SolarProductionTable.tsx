import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarProductionData, SortField, SortOrder } from "@/types/solarProduction";
import { Filter, ArrowUpDown, TrendingUp, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface SolarProductionTableProps {
	data: SolarProductionData[];
}

const MESES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

const getProductionColorClass = (produccion: number): string => {
	if (produccion >= 340) {
		return "bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500";
	} else if (produccion >= 310) {
		return "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500";
	} else if (produccion >= 300) {
		return "bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500";
	} else {
		return "bg-orange-50 dark:bg-orange-950/30 border-l-4 border-orange-500";
	}
};

const getProductionBadgeVariant = (produccion: number): "default" | "secondary" | "outline" => {
	if (produccion >= 340) return "default";
	if (produccion >= 310) return "secondary";
	return "outline";
};

export const SolarProductionTable = ({ data }: SolarProductionTableProps) => {
	const [filterMes, setFilterMes] = useState<string>("todos");
	const [filterDepartamento, setFilterDepartamento] = useState<string>("todos");
	const [sortField, setSortField] = useState<SortField>("mes");
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
	const [searchTerm, setSearchTerm] = useState<string>("");

	const departamentos = useMemo(() => {
		const depts = new Set(data.map((item) => item.departamento));
		return Array.from(depts).sort();
	}, [data]);

	const filteredAndSortedData = useMemo(() => {
		let filtered = data.filter((item) => {
			const matchesMes = filterMes === "todos" || item.mes === filterMes;
			const matchesDepartamento =
				filterDepartamento === "todos" || item.departamento === filterDepartamento;
			const matchesSearch =
				searchTerm === "" ||
				item.mes.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.produccion_mwh.toString().includes(searchTerm);
			return matchesMes && matchesDepartamento && matchesSearch;
		});

		filtered.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			if (sortField === "produccion_mwh") {
				aValue = a.produccion_mwh;
				bValue = b.produccion_mwh;
			} else if (sortField === "mes") {
				aValue = MESES.indexOf(a.mes);
				bValue = MESES.indexOf(b.mes);
			} else {
				aValue = a.departamento;
				bValue = b.departamento;
			}

			if (sortOrder === "asc") {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});

		return filtered;
	}, [data, filterMes, filterDepartamento, searchTerm, sortField, sortOrder]);

	const statistics = useMemo(() => {
		if (filteredAndSortedData.length === 0) {
			return {
				total: 0,
				promedio: 0,
				maximo: 0,
				minimo: 0,
			};
		}

		const producciones = filteredAndSortedData.map((item) => item.produccion_mwh);
		const total = producciones.reduce((sum, val) => sum + val, 0);
		const promedio = total / producciones.length;
		const maximo = Math.max(...producciones);
		const minimo = Math.min(...producciones);

		return { total, promedio, maximo, minimo };
	}, [filteredAndSortedData]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
	};

	const clearFilters = () => {
		setFilterMes("todos");
		setFilterDepartamento("todos");
		setSearchTerm("");
	};

	return (
		<div className="space-y-6">
			{/* Filtros y controles */}
			<Card className="glass-card shadow-medium">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="h-5 w-5 text-primary" />
						Filtros y Búsqueda
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="space-y-2">
							<Label htmlFor="search">Búsqueda</Label>
							<Input
								id="search"
								placeholder="Buscar..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mes">Mes</Label>
							<Select value={filterMes} onValueChange={setFilterMes}>
								<SelectTrigger id="mes">
									<SelectValue placeholder="Todos los meses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos los meses</SelectItem>
									{MESES.map((mes) => (
										<SelectItem key={mes} value={mes}>
											{mes}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="departamento">Departamento</Label>
							<Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
								<SelectTrigger id="departamento">
									<SelectValue placeholder="Todos los departamentos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos los departamentos</SelectItem>
									{departamentos.map((dept) => (
										<SelectItem key={dept} value={dept}>
											{dept}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>&nbsp;</Label>
							<Button variant="outline" onClick={clearFilters} className="w-full">
								Limpiar filtros
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Estadísticas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className="glass-card shadow-soft">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Producción</p>
								<p className="text-2xl font-bold">{statistics.total.toFixed(0)} MWh</p>
							</div>
							<Sun className="h-8 w-8 text-primary opacity-50" />
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card shadow-soft">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Promedio</p>
								<p className="text-2xl font-bold">{statistics.promedio.toFixed(1)} MWh</p>
							</div>
							<TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card shadow-soft">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Máximo</p>
								<p className="text-2xl font-bold">{statistics.maximo} MWh</p>
							</div>
							<div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
								<span className="text-emerald-500 text-xs font-bold">↑</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card shadow-soft">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Mínimo</p>
								<p className="text-2xl font-bold">{statistics.minimo} MWh</p>
							</div>
							<div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
								<span className="text-orange-500 text-xs font-bold">↓</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabla */}
			<Card className="glass-card shadow-medium">
				<CardHeader>
					<CardTitle>Producción Solar Mensual</CardTitle>
					<p className="text-sm text-muted-foreground mt-1">
						{filteredAndSortedData.length} registro(s) encontrado(s)
					</p>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort("mes")}
											className="h-auto p-0 font-medium hover:bg-transparent"
										>
											Mes
											<ArrowUpDown className="ml-2 h-4 w-4" />
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort("departamento")}
											className="h-auto p-0 font-medium hover:bg-transparent"
										>
											Departamento
											<ArrowUpDown className="ml-2 h-4 w-4" />
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort("produccion_mwh")}
											className="h-auto p-0 font-medium hover:bg-transparent"
										>
											Producción (MWh)
											<ArrowUpDown className="ml-2 h-4 w-4" />
										</Button>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAndSortedData.length === 0 ? (
									<TableRow>
										<TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
											No se encontraron registros con los filtros aplicados
										</TableCell>
									</TableRow>
								) : (
									filteredAndSortedData.map((item, index) => (
										<TableRow
											key={`${item.mes}-${item.departamento}-${index}`}
											className={cn(
												"transition-smooth cursor-pointer",
												getProductionColorClass(item.produccion_mwh)
											)}
										>
											<TableCell className="font-medium">{item.mes}</TableCell>
											<TableCell>{item.departamento}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="font-semibold">{item.produccion_mwh}</span>
													<Badge variant={getProductionBadgeVariant(item.produccion_mwh)}>
														MWh
													</Badge>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Leyenda de colores */}
					<div className="mt-4 p-4 bg-muted/50 rounded-lg">
						<p className="text-sm font-medium mb-2">Leyenda de Clasificación:</p>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 rounded border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"></div>
								<span>≥ 340 MWh (Alto)</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 rounded border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30"></div>
								<span>310-339 MWh (Medio-Alto)</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 rounded border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30"></div>
								<span>300-309 MWh (Medio)</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 rounded border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30"></div>
								<span>&lt; 300 MWh (Bajo)</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

