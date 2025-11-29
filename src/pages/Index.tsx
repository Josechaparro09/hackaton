import { useState } from "react";
import { Link } from "react-router-dom";
import { ApplianceForm } from "@/components/ApplianceForm";
import { ApplianceList } from "@/components/ApplianceList";
import { ConsumptionDashboard } from "@/components/ConsumptionDashboard";
import { SolarBatteryPrediction } from "@/components/SolarBatteryPrediction";
import { PriceSettings } from "@/components/PriceSettings";
import { Button } from "@/components/ui/button";
import { Appliance } from "@/types/appliance";
import { calculateConsumption } from "@/utils/consumptionCalculator";
import { Zap, Sun } from "lucide-react";

const Index = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [pricePerKwh, setPricePerKwh] = useState(0.15);

  const handleAddAppliance = (appliance: Omit<Appliance, "id">) => {
    const newAppliance: Appliance = {
      ...appliance,
      id: crypto.randomUUID(),
    };
    setAppliances([...appliances, newAppliance]);
  };

  const handleDeleteAppliance = (id: string) => {
    setAppliances(appliances.filter((a) => a.id !== id));
  };

  const summary = calculateConsumption(appliances, pricePerKwh);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
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
                <p className="text-muted-foreground">Calculadora de Consumo Eléctrico</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/energy-prediction">
                <Button variant="outline" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Predicción
                </Button>
              </Link>
              <Link to="/solar-production">
                <Button variant="outline" className="gap-2">
                  <Sun className="h-4 w-4" />
                  Producción Solar
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        {appliances.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <ConsumptionDashboard summary={summary} />
          </div>
        )}

        {/* Predicción Solar y Baterías */}
        {appliances.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <SolarBatteryPrediction appliances={appliances} pricePerKwh={pricePerKwh} />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form & Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
              <ApplianceForm onAdd={handleAddAppliance} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <PriceSettings pricePerKwh={pricePerKwh} onPriceChange={setPricePerKwh} />
            </div>
          </div>

          {/* Right Column - List */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <ApplianceList appliances={appliances} onDelete={handleDeleteAppliance} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
