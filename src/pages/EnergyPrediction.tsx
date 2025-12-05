import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApplianceList } from "@/components/ApplianceList";
import { ConsumptionDashboard } from "@/components/ConsumptionDashboard";
import { SolarBatteryPrediction } from "@/components/SolarBatteryPrediction";
import { PriceSettings } from "@/components/PriceSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Appliance } from "@/types/appliance";
import { getAppliances, deleteAppliance } from "@/lib/supabase-queries";
import { dbApplianceToUI } from "@/utils/applianceConverter";
import { calculateConsumption } from "@/utils/consumptionCalculator";
import { Zap, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY_PRICE = "ecowatt_price_per_kwh";
const STORAGE_KEY_APPLIANCES = "ecowatt_appliances";

import type { PeriodFilter } from "@/components/ConsumptionDashboard";

const EnergyPrediction = () => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [pricePerKwh, setPricePerKwh] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEY_PRICE);
		return stored ? parseFloat(stored) : 0.15;
	});
	const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("daily");

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

	// Mutación para eliminar
	const deleteMutation = useMutation({
		mutationFn: deleteAppliance,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["appliances"] });
			toast.success("Electrodoméstico eliminado");
		},
		onError: (error: Error) => {
			toast.error("Error al eliminar electrodoméstico", {
				description: error.message,
			});
		},
	});

	// Sincronizar datos de Supabase con estado local cuando cambian
	useEffect(() => {
		if (user && dbAppliances) {
			// Los datos vienen de Supabase, no hacer nada
		} else if (!user) {
			// Guardar en localStorage cuando cambian (solo si no hay usuario)
			localStorage.setItem(STORAGE_KEY_APPLIANCES, JSON.stringify(localAppliances));
		}
	}, [dbAppliances, localAppliances, user]);

	// Guardar precio en localStorage
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY_PRICE, pricePerKwh.toString());
	}, [pricePerKwh]);

	const handleDeleteAppliance = async (id: string) => {
		if (user) {
			// Eliminar de Supabase
			try {
				await deleteMutation.mutateAsync(id);
			} catch (error) {
				// Error manejado en onError
			}
		} else {
			// Eliminar de localStorage
			const updated = localAppliances.filter((a) => a.id !== id);
			setLocalAppliances(updated);
		}
	};

	const summary = calculateConsumption(appliances, pricePerKwh);

	return (
		<Layout>
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				{/* Header */}
				<header className="mb-8 animate-fade-in">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-3">
							<div className="p-3 rounded-xl gradient-primary">
								<Zap className="h-8 w-8 text-white" />
							</div>
							<div>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
									EcoWatt
								</h1>
								<p className="text-muted-foreground">Predicción de Consumo Energético</p>
							</div>
						</div>
					</div>
				</header>

				{/* Filtro de Período */}
				{appliances.length > 0 && (
					<div className="mb-4 sm:mb-6 animate-fade-in">
						<div className="flex items-center gap-3">
							<Calendar className="h-5 w-5 text-muted-foreground" />
							<Label htmlFor="period-filter" className="text-sm font-medium">
								Filtrar por:
							</Label>
							<Select value={periodFilter} onValueChange={(value: PeriodFilter) => setPeriodFilter(value)}>
								<SelectTrigger id="period-filter" className="w-[180px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="daily">Diario</SelectItem>
									<SelectItem value="weekly">Semanal</SelectItem>
									<SelectItem value="monthly">Mensual</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				{/* Dashboard */}
				{appliances.length > 0 && (
					<div className="mb-4 sm:mb-8 animate-fade-in">
						<ConsumptionDashboard summary={summary} periodFilter={periodFilter} />
					</div>
				)}

				{/* Predicción Solar y Baterías */}
				{appliances.length > 0 && (
					<div className="mb-4 sm:mb-8 animate-fade-in">
						<SolarBatteryPrediction appliances={appliances} pricePerKwh={pricePerKwh} periodFilter={periodFilter} />
					</div>
				)}

				{/* Loading State */}
				{isLoading && user && (
					<div className="space-y-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
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

				{/* Main Content */}
				{!isLoading && (
					<div className="space-y-4 sm:space-y-6">
						{/* List */}
						<div className="animate-fade-in">
							<ApplianceList appliances={appliances} onDelete={handleDeleteAppliance} />
						</div>
						
						{/* Settings */}
						{appliances.length > 0 && (
							<div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
								<PriceSettings pricePerKwh={pricePerKwh} onPriceChange={setPricePerKwh} />
							</div>
						)}
					</div>
				)}
			</div>
		</Layout>
	);
};

export default EnergyPrediction;

