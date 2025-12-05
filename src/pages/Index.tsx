import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ConsumptionDashboard } from "@/components/ConsumptionDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appliance } from "@/types/appliance";
import { getAppliances } from "@/lib/supabase-queries";
import { dbApplianceToUI } from "@/utils/applianceConverter";
import { calculateConsumption, APPLIANCE_CATEGORIES } from "@/utils/consumptionCalculator";
import { Zap, AlertCircle, Package, Clock, Award, BarChart3, PieChart } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

const STORAGE_KEY_APPLIANCES = "ecowatt_appliances";
const STORAGE_KEY_PRICE = "ecowatt_price_per_kwh";

const Index = () => {
	const { user } = useAuth();
	const [pricePerKwh] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEY_PRICE);
		return stored ? parseFloat(stored) : 0.15;
	});

	// Cargar electrodomésticos desde Supabase si hay usuario
	const { data: dbAppliances, isLoading, error } = useQuery({
		queryKey: ["appliances"],
		queryFn: getAppliances,
		enabled: !!user,
	});

	// Estado local para electrodomésticos (para usuarios sin autenticación)
	const [localAppliances, setLocalAppliances] = useState<Appliance[]>([]);

	// Cargar desde localStorage al inicio si no hay usuario
	useEffect(() => {
		if (!user) {
			const stored = localStorage.getItem(STORAGE_KEY_APPLIANCES);
			if (stored) {
				try {
					setLocalAppliances(JSON.parse(stored));
				} catch (e) {
					console.error("Error al cargar electrodomésticos desde localStorage:", e);
				}
			}
		} else {
			// Limpiar estado local cuando hay usuario
			setLocalAppliances([]);
		}
	}, [user]);

	// Convertir electrodomésticos de DB a UI
	const appliances: Appliance[] = user && dbAppliances
		? dbAppliances.map(dbApplianceToUI)
		: localAppliances;

	// Calcular resumen de consumo
	const summary = useMemo(() => {
		return calculateConsumption(appliances, pricePerKwh);
	}, [appliances, pricePerKwh]);

	// Calcular KPIs adicionales y datos para gráficas
	const { kpis, chartData } = useMemo(() => {
		const totalAppliances = appliances.length;
		const totalPower = appliances.reduce((sum, a) => sum + a.powerWatts, 0);
		const avgHours = appliances.length > 0
			? appliances.reduce((sum, a) => sum + a.hoursPerDay, 0) / appliances.length
			: 0;
		
		// Electrodoméstico con mayor consumo
		const highestConsumer = appliances.length > 0
			? appliances.reduce((max, a) => {
				const consumption = (a.powerWatts * a.hoursPerDay) / 1000;
				const maxConsumption = (max.powerWatts * max.hoursPerDay) / 1000;
				return consumption > maxConsumption ? a : max;
			})
			: null;

		// Datos para gráfico de pastel por categoría
		const categoryConsumption = APPLIANCE_CATEGORIES.map(category => {
			const categoryAppliances = appliances.filter(a => a.category === category);
			const dailyKwh = categoryAppliances.reduce((sum, a) => {
				return sum + (a.powerWatts * a.hoursPerDay) / 1000;
			}, 0);
			return {
				name: category,
				value: Number(dailyKwh.toFixed(2)),
				count: categoryAppliances.length,
			};
		}).filter(item => item.value > 0);

		// Datos para gráfico de barras - Top electrodomésticos
		const topAppliances = [...appliances]
			.map(a => ({
				name: a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name,
				fullName: a.name,
				consumption: Number(((a.powerWatts * a.hoursPerDay) / 1000).toFixed(2)),
				power: a.powerWatts,
				hours: a.hoursPerDay,
			}))
			.sort((a, b) => b.consumption - a.consumption)
			.slice(0, 5);

		return {
			kpis: {
				totalAppliances,
				totalPower,
				avgHours,
				highestConsumer,
			},
			chartData: {
				categoryConsumption,
				topAppliances,
			},
		};
	}, [appliances]);

	// Colores para gráficos
	const COLORS = [
		'#10b981', // emerald
		'#3b82f6', // blue
		'#8b5cf6', // violet
		'#f59e0b', // amber
		'#ef4444', // red
		'#06b6d4', // cyan
		'#ec4899', // pink
	];

	const chartConfig = {
		consumption: {
			label: "Consumo (kWh/día)",
			color: "hsl(var(--chart-1))",
		},
	};

	return (
		<Layout>
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				{/* Header */}
				<header className="mb-8 animate-fade-in">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-3 rounded-xl gradient-primary">
							<Zap className="h-8 w-8 text-white" />
						</div>
						<div>
							<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
								EcoWatt
							</h1>
							<p className="text-muted-foreground">Panel de Indicadores</p>
						</div>
					</div>
				</header>

				{/* Loading State */}
				{isLoading && user && (
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-32 w-full" />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-32 w-full" />
						</div>
					</div>
				)}

				{/* Error State */}
				{error && user && (
					<Alert variant="destructive" className="mb-6">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Error al cargar electrodomésticos. Por favor, intenta recargar la página.
						</AlertDescription>
					</Alert>
				)}

				{/* KPIs */}
				{!isLoading && (
					<div className="space-y-6 animate-fade-in">
						{/* Dashboard de Consumo */}
						{appliances.length > 0 && (
							<div>
								<h2 className="text-2xl font-semibold mb-4">Consumo Energético</h2>
								<ConsumptionDashboard summary={summary} />
							</div>
						)}

						{/* KPIs Adicionales */}
						{appliances.length > 0 && (
							<div className="space-y-6">
								<h2 className="text-2xl font-semibold mb-4">Estadísticas de Electrodomésticos</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									{/* Total de Electrodomésticos */}
									<Card className="glass-card shadow-medium overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
										<CardContent className="p-6 relative">
											<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl -z-0" />
											<div className="flex items-start justify-between mb-4 relative z-10">
												<div>
													<p className="text-sm text-muted-foreground mb-1 font-medium">Total de Electrodomésticos</p>
													<div className="flex items-baseline gap-1">
														<span className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">{kpis.totalAppliances}</span>
													</div>
												</div>
												<div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
													<Package className="h-6 w-6 text-white" />
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Potencia Total */}
									<Card className="glass-card shadow-medium overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
										<CardContent className="p-6 relative">
											<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl -z-0" />
											<div className="flex items-start justify-between mb-4 relative z-10">
												<div>
													<p className="text-sm text-muted-foreground mb-1 font-medium">Potencia Total</p>
													<div className="flex items-baseline gap-1">
														<span className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">{kpis.totalPower.toFixed(0)}</span>
														<span className="text-sm text-muted-foreground">W</span>
													</div>
												</div>
												<div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
													<Zap className="h-6 w-6 text-white" />
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Promedio de Horas */}
									<Card className="glass-card shadow-medium overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-violet-200 dark:hover:border-violet-800">
										<CardContent className="p-6 relative">
											<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-2xl -z-0" />
											<div className="flex items-start justify-between mb-4 relative z-10">
												<div>
													<p className="text-sm text-muted-foreground mb-1 font-medium">Promedio de Horas</p>
													<div className="flex items-baseline gap-1">
														<span className="text-4xl font-bold bg-gradient-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent">{kpis.avgHours.toFixed(1)}</span>
														<span className="text-sm text-muted-foreground">h/día</span>
													</div>
												</div>
												<div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
													<Clock className="h-6 w-6 text-white" />
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Mayor Consumidor */}
									<Card className="glass-card shadow-medium overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800">
										<CardContent className="p-6 relative">
											<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-2xl -z-0" />
											<div className="flex items-start justify-between mb-4 relative z-10">
												<div className="flex-1">
													<p className="text-sm text-muted-foreground mb-1 font-medium">Mayor Consumidor</p>
													{kpis.highestConsumer ? (
														<>
															<p className="text-lg font-semibold truncate bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{kpis.highestConsumer.name}</p>
															<p className="text-sm text-muted-foreground mt-1">
																{((kpis.highestConsumer.powerWatts * kpis.highestConsumer.hoursPerDay) / 1000).toFixed(2)} kWh/día
															</p>
														</>
													) : (
														<p className="text-sm text-muted-foreground">N/A</p>
													)}
												</div>
												<div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
													<Award className="h-6 w-6 text-white" />
												</div>
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Gráficas */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{/* Gráfico de Pastel por Categoría */}
									{chartData.categoryConsumption.length > 0 && (
										<Card className="glass-card shadow-medium">
											<CardHeader>
												<CardTitle className="flex items-center gap-2">
													<PieChart className="h-5 w-5 text-primary" />
													Consumo por Categoría
												</CardTitle>
											</CardHeader>
											<CardContent>
												<ChartContainer config={chartConfig} className="h-[350px]">
													<RechartsPieChart>
														<Pie
															data={chartData.categoryConsumption}
															cx="50%"
															cy="50%"
															labelLine={false}
															label={({ name, value, percent }) => 
																`${name}: ${(percent * 100).toFixed(0)}%`
															}
															outerRadius={100}
															fill="#8884d8"
															dataKey="value"
														>
															{chartData.categoryConsumption.map((entry, index) => (
																<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
															))}
														</Pie>
														<ChartTooltip 
															content={<ChartTooltipContent />}
															formatter={(value: number) => [`${value} kWh/día`, 'Consumo']}
														/>
													</RechartsPieChart>
												</ChartContainer>
											</CardContent>
										</Card>
									)}

									{/* Gráfico de Barras - Top Electrodomésticos */}
									{chartData.topAppliances.length > 0 && (
										<Card className="glass-card shadow-medium">
											<CardHeader>
												<CardTitle className="flex items-center gap-2">
													<BarChart3 className="h-5 w-5 text-primary" />
													Top 5 Electrodomésticos por Consumo
												</CardTitle>
											</CardHeader>
											<CardContent>
												<ChartContainer config={chartConfig} className="h-[350px]">
													<BarChart data={chartData.topAppliances} layout="vertical">
														<CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
														<XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
														<YAxis 
															type="category" 
															dataKey="name" 
															tickLine={false}
															axisLine={false}
															width={100}
															className="text-xs"
														/>
														<ChartTooltip 
															content={<ChartTooltipContent />}
															formatter={(value: number, name: string, props: any) => [
																`${value} kWh/día`,
																`${props.payload.fullName} (${props.payload.power}W × ${props.payload.hours}h)`
															]}
														/>
														<Bar 
															dataKey="consumption" 
															fill="var(--color-consumption)"
															radius={[0, 8, 8, 0]}
														>
															{chartData.topAppliances.map((entry, index) => (
																<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
															))}
														</Bar>
													</BarChart>
												</ChartContainer>
											</CardContent>
										</Card>
									)}
								</div>
							</div>
						)}

						{/* Estado vacío */}
						{appliances.length === 0 && (
							<Card className="glass-card shadow-medium">
								<CardContent className="py-12">
									<div className="text-center text-muted-foreground">
										<Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p className="text-lg font-medium">No hay electrodomésticos agregados</p>
										<p className="text-sm mt-2">Agrega electrodomésticos para ver los indicadores</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</Layout>
	);
};

export default Index;
