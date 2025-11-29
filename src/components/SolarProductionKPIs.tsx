import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarProductionData } from "@/types/solarProduction";
import { Sun, TrendingUp, Award, Calendar, Filter, BarChart3, LineChart, PieChart, AreaChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart as RechartsLineChart, Line, Area, AreaChart as RechartsAreaChart, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface SolarProductionKPIsProps {
	data: SolarProductionData[];
}

const MESES = [
	"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
	"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const COLORS = {
	"La Guajira": "#f59e0b",
	"Cesar": "#3b82f6",
	"Atlántico": "#10b981",
	"Magdalena": "#8b5cf6",
};

const COLORS_ARRAY = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

export const SolarProductionKPIs = ({ data }: SolarProductionKPIsProps) => {
	const [selectedMes, setSelectedMes] = useState<string>("todos");
	const [selectedDepartamento, setSelectedDepartamento] = useState<string>("todos");
	const [selectedDepartamentos, setSelectedDepartamentos] = useState<string[]>([]);

	const departamentosUnicos = useMemo(() => {
		const depts = new Set(data.map((item) => item.departamento));
		return Array.from(depts).sort();
	}, [data]);

	// Datos filtrados
	const filteredData = useMemo(() => {
		return data.filter((item) => {
			const matchesMes = selectedMes === "todos" || item.mes === selectedMes;
			
			// Si hay departamentos seleccionados múltiples, usar esos
			// Si hay un departamento seleccionado individual, usar ese
			// Si no hay nada seleccionado, mostrar todos
			let matchesDepartamento = true;
			if (selectedDepartamentos.length > 0) {
				matchesDepartamento = selectedDepartamentos.includes(item.departamento);
			} else if (selectedDepartamento !== "todos") {
				matchesDepartamento = item.departamento === selectedDepartamento;
			}
			
			return matchesMes && matchesDepartamento;
		});
	}, [data, selectedMes, selectedDepartamento, selectedDepartamentos]);

	const kpis = useMemo(() => {
		const dataToUse = filteredData;
		if (!dataToUse || dataToUse.length === 0) {
			return {
				totalAnual: 0,
				promedioMensual: 0,
				mejorDepartamento: { nombre: "-", promedio: 0 },
				mejorMes: { nombre: "-", total: 0 },
			};
		}

		// Producción Total Anual (suma de todos los registros)
		const totalAnual = dataToUse.reduce((sum, item) => sum + item.produccion_mwh, 0);

		// Promedio Mensual (promedio de todos los registros)
		const promedioMensual = totalAnual / dataToUse.length;

		// Mejor Departamento (mayor promedio)
		const departamentos = new Map<string, { total: number; count: number }>();
		dataToUse.forEach((item) => {
			const existing = departamentos.get(item.departamento) || { total: 0, count: 0 };
			departamentos.set(item.departamento, {
				total: existing.total + item.produccion_mwh,
				count: existing.count + 1,
			});
		});

		let mejorDepartamento = { nombre: "-", promedio: 0 };
		departamentos.forEach((stats, nombre) => {
			const promedio = stats.total / stats.count;
			if (promedio > mejorDepartamento.promedio) {
				mejorDepartamento = { nombre, promedio };
			}
		});

		// Mejor Mes (mes con mayor producción total)
		const meses = new Map<string, number>();
		dataToUse.forEach((item) => {
			const existing = meses.get(item.mes) || 0;
			meses.set(item.mes, existing + item.produccion_mwh);
		});

		let mejorMes = { nombre: "-", total: 0 };
		meses.forEach((total, nombre) => {
			if (total > mejorMes.total) {
				mejorMes = { nombre, total };
			}
		});

		return {
			totalAnual,
			promedioMensual,
			mejorDepartamento,
			mejorMes,
		};
	}, [filteredData, data]);

	// Datos para gráfico de barras por departamento
	const chartDataByDepartamento = useMemo(() => {
		const dataToUse = filteredData;
		const departamentos = new Map<string, { total: number; count: number }>();
		
		dataToUse.forEach((item) => {
			const existing = departamentos.get(item.departamento) || { total: 0, count: 0 };
			departamentos.set(item.departamento, {
				total: existing.total + item.produccion_mwh,
				count: existing.count + 1,
			});
		});

		return Array.from(departamentos.entries())
			.map(([nombre, stats]) => ({
				departamento: nombre,
				promedio: stats.total / stats.count,
				total: stats.total,
			}))
			.sort((a, b) => b.total - a.total);
	}, [filteredData, data]);

	// Datos para gráfico de líneas por mes
	const chartDataByMes = useMemo(() => {
		const dataToUse = filteredData;
		const mesesData = new Map<string, Map<string, number>>();
		
		dataToUse.forEach((item) => {
			if (!mesesData.has(item.mes)) {
				mesesData.set(item.mes, new Map());
			}
			const deptMap = mesesData.get(item.mes)!;
			const existing = deptMap.get(item.departamento) || 0;
			deptMap.set(item.departamento, existing + item.produccion_mwh);
		});

		return MESES.filter(mes => mesesData.has(mes)).map((mes) => {
			const deptMap = mesesData.get(mes)!;
			const result: { [key: string]: string | number } = { mes };
			
			departamentosUnicos.forEach((dept) => {
				result[dept] = deptMap.get(dept) || 0;
			});
			result.total = Array.from(deptMap.values()).reduce((sum, val) => sum + val, 0);
			
			return result;
		});
	}, [filteredData, data, departamentosUnicos]);

	// Datos para gráfico de pie/dona
	const chartDataPie = useMemo(() => {
		const dataToUse = filteredData;
		const departamentos = new Map<string, number>();
		
		dataToUse.forEach((item) => {
			const existing = departamentos.get(item.departamento) || 0;
			departamentos.set(item.departamento, existing + item.produccion_mwh);
		});

		return Array.from(departamentos.entries()).map(([name, value]) => ({
			name,
			value: Math.round(value),
			color: COLORS[name as keyof typeof COLORS] || "#6b7280",
		}));
	}, [filteredData, data]);

	const toggleDepartamento = (dept: string) => {
		setSelectedDepartamentos((prev) =>
			prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
		);
		setSelectedDepartamento("todos");
	};

	const handleDepartamentoChange = (value: string) => {
		setSelectedDepartamento(value);
		if (value !== "todos") {
			setSelectedDepartamentos([]);
		}
	};

	const clearFilters = () => {
		setSelectedMes("todos");
		setSelectedDepartamento("todos");
		setSelectedDepartamentos([]);
	};

	const stats = [
		{
			title: "Producción Total",
			value: kpis.totalAnual.toFixed(0),
			unit: "MWh",
			subtitle: "Suma de todos los registros",
			icon: Sun,
			gradient: "from-amber-500 to-orange-500",
		},
		{
			title: "Promedio",
			value: kpis.promedioMensual.toFixed(1),
			unit: "MWh",
			subtitle: "Promedio por registro",
			icon: TrendingUp,
			gradient: "from-emerald-500 to-teal-500",
		},
		{
			title: "Mejor Departamento",
			value: kpis.mejorDepartamento.nombre,
			unit: `${kpis.mejorDepartamento.promedio.toFixed(1)} MWh`,
			subtitle: "Mayor promedio",
			icon: Award,
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			title: "Mejor Mes",
			value: kpis.mejorMes.nombre,
			unit: `${kpis.mejorMes.total.toFixed(0)} MWh`,
			subtitle: "Mayor producción",
			icon: Calendar,
			gradient: "from-violet-500 to-purple-500",
		},
	];

	const chartConfig = useMemo(() => {
		const config: Record<string, { label: string; color: string }> = {
			total: { label: "Total", color: "#f59e0b" },
		};
		
		departamentosUnicos.forEach((dept) => {
			config[dept] = {
				label: dept,
				color: COLORS[dept as keyof typeof COLORS] || "#6b7280",
			};
		});
		
		return config;
	}, [departamentosUnicos]);

	return (
		<div className="space-y-6">
			{/* KPIs Resumidos */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card
							key={stat.title}
							className="glass-card shadow-medium overflow-hidden hover:shadow-lg transition-smooth"
						>
							<CardContent className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
										<div className="flex items-baseline gap-1 flex-wrap">
											<span className="text-2xl font-bold">{stat.value}</span>
											{stat.unit && (
												<span className="text-sm text-muted-foreground">{stat.unit}</span>
											)}
										</div>
										{stat.subtitle && (
											<p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
										)}
									</div>
									<div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
										<Icon className="h-6 w-6 text-white" />
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Filtros */}
			<Card className="glass-card shadow-medium">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Filter className="h-5 w-5 text-primary" />
							Filtros de Gráficos
						</CardTitle>
						<Button variant="outline" size="sm" onClick={clearFilters}>
							Limpiar
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Filtrar por Mes</Label>
							<Select value={selectedMes} onValueChange={setSelectedMes}>
								<SelectTrigger>
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
							<Label>Filtrar por Departamento</Label>
							<Select value={selectedDepartamento} onValueChange={handleDepartamentoChange}>
								<SelectTrigger>
									<SelectValue placeholder="Todos los departamentos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos los departamentos</SelectItem>
									{departamentosUnicos.map((dept) => (
										<SelectItem key={dept} value={dept}>
											{dept}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="mt-4 space-y-2">
						<Label>Seleccionar Múltiples Departamentos</Label>
						<div className="flex flex-wrap gap-4">
							{departamentosUnicos.map((dept) => (
								<div key={dept} className="flex items-center space-x-2">
									<Checkbox
										id={`dept-${dept}`}
										checked={selectedDepartamentos.includes(dept)}
										onCheckedChange={() => toggleDepartamento(dept)}
									/>
									<label
										htmlFor={`dept-${dept}`}
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
									>
										{dept}
									</label>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Gráficos */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Gráfico de Barras por Departamento */}
				<Card className="glass-card shadow-medium">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5 text-primary" />
							Producción por Departamento
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<BarChart data={chartDataByDepartamento}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis 
									dataKey="departamento" 
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									className="text-xs"
								/>
								<YAxis 
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									className="text-xs"
									label={{ value: 'MWh', angle: -90, position: 'insideLeft' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar 
									dataKey="promedio" 
									fill="var(--color-total)"
									radius={[8, 8, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Gráfico de Líneas por Mes */}
				<Card className="glass-card shadow-medium">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<LineChart className="h-5 w-5 text-primary" />
							Evolución Mensual
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<RechartsLineChart data={chartDataByMes}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis 
									dataKey="mes" 
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									className="text-xs"
									angle={-45}
									textAnchor="end"
									height={80}
								/>
								<YAxis 
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									className="text-xs"
									label={{ value: 'MWh', angle: -90, position: 'insideLeft' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								{departamentosUnicos.map((dept, index) => (
									<Line
										key={dept}
										type="monotone"
										dataKey={dept}
										stroke={COLORS_ARRAY[index % COLORS_ARRAY.length]}
										strokeWidth={2}
										dot={{ r: 4 }}
										activeDot={{ r: 6 }}
									/>
								))}
							</RechartsLineChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Gráfico de Área Total */}
				<Card className="glass-card shadow-medium">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AreaChart className="h-5 w-5 text-primary" />
							Producción Total por Mes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<RechartsAreaChart data={chartDataByMes}>
								<defs>
									<linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
										<stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis 
									dataKey="mes" 
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									className="text-xs"
									angle={-45}
									textAnchor="end"
									height={80}
								/>
								<YAxis 
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									className="text-xs"
									label={{ value: 'MWh', angle: -90, position: 'insideLeft' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="total"
									stroke="#f59e0b"
									fill="url(#colorTotal)"
									strokeWidth={2}
								/>
							</RechartsAreaChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Gráfico de Pie/Dona */}
				<Card className="glass-card shadow-medium">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="h-5 w-5 text-primary" />
							Distribución por Departamento
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<RechartsPieChart>
								<Pie
									data={chartDataPie}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
									outerRadius={100}
									fill="#8884d8"
									dataKey="value"
								>
									{chartDataPie.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<ChartTooltip content={<ChartTooltipContent />} />
							</RechartsPieChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

