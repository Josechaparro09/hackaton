import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApplianceForm } from "@/components/ApplianceForm";
import { ApplianceList } from "@/components/ApplianceList";
import { ConsumptionDashboard } from "@/components/ConsumptionDashboard";
import { SolarBatteryPrediction } from "@/components/SolarBatteryPrediction";
import { PriceSettings } from "@/components/PriceSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Appliance } from "@/types/appliance";
import { getAppliances, createAppliance, deleteAppliance } from "@/lib/supabase-queries";
import { dbApplianceToUI, uiApplianceToDB } from "@/utils/applianceConverter";
import { geminiDataToDB } from "@/utils/geminiConverter";
import type { ExtractedApplianceData } from "@/lib/gemini-service";
import { calculateConsumption } from "@/utils/consumptionCalculator";
import { Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY_PRICE = "ecowatt_price_per_kwh";
const STORAGE_KEY_APPLIANCES = "ecowatt_appliances";

const EnergyPrediction = () => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [pricePerKwh, setPricePerKwh] = useState(() => {
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

	// Mutaciones para crear y eliminar
	const createMutation = useMutation({
		mutationFn: createAppliance,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["appliances"] });
			toast.success("Electrodoméstico agregado");
		},
		onError: (error: Error) => {
			toast.error("Error al agregar electrodoméstico", {
				description: error.message,
			});
		},
	});

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

	const handleAddAppliance = async (appliance: Omit<Appliance, "id">) => {
		if (user) {
			// Guardar en Supabase
			try {
				await createMutation.mutateAsync(uiApplianceToDB(appliance));
			} catch (error) {
				// Error manejado en onError
			}
		} else {
			// Guardar en localStorage
			const newAppliance: Appliance = {
				...appliance,
				id: crypto.randomUUID(),
			};
			const updated = [...localAppliances, newAppliance];
			setLocalAppliances(updated);
		}
	};

	const handleAddApplianceWithGeminiData = async (
		geminiData: ExtractedApplianceData,
		dailyHours: number
	) => {
		if (user) {
			// Guardar en Supabase con todos los datos de Gemini
			try {
				const dbData = geminiDataToDB(geminiData, dailyHours);
				await createMutation.mutateAsync(dbData);
			} catch (error) {
				// Error manejado en onError
			}
		} else {
			// Para usuarios sin autenticación, convertir a formato UI básico
			const uiAppliance: Appliance = {
				id: crypto.randomUUID(),
				name: geminiData.name,
				powerWatts: geminiData.power_watts,
				hoursPerDay: dailyHours,
				category: geminiData.category,
			};
			const updated = [...localAppliances, uiAppliance];
			setLocalAppliances(updated);
		}
	};

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

				{/* Dashboard */}
				{appliances.length > 0 && (
					<div className="mb-4 sm:mb-8 animate-fade-in">
						<ConsumptionDashboard summary={summary} />
					</div>
				)}

				{/* Predicción Solar y Baterías */}
				{appliances.length > 0 && (
					<div className="mb-4 sm:mb-8 animate-fade-in">
						<SolarBatteryPrediction appliances={appliances} pricePerKwh={pricePerKwh} />
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
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
						{/* Left Column - Form & Settings */}
						<div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
							<div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
								<ApplianceForm 
									onAdd={handleAddAppliance}
									onAddWithGeminiData={handleAddApplianceWithGeminiData}
								/>
							</div>
							<div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
								<PriceSettings pricePerKwh={pricePerKwh} onPriceChange={setPricePerKwh} />
							</div>
						</div>

						{/* Right Column - List */}
						<div className="lg:col-span-2 animate-fade-in order-1 lg:order-2" style={{ animationDelay: "300ms" }}>
							<ApplianceList appliances={appliances} onDelete={handleDeleteAppliance} />
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
};

export default EnergyPrediction;

