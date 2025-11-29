import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, PenTool } from "lucide-react";
import { Appliance } from "@/types/appliance";
import { APPLIANCE_CATEGORIES } from "@/utils/consumptionCalculator";
import { ImageUploadAnalyzer } from "./ImageUploadAnalyzer";
import type { ExtractedApplianceData } from "@/lib/gemini-service";

interface ApplianceFormProps {
  onAdd: (appliance: Omit<Appliance, "id">) => void;
  onAddWithGeminiData?: (geminiData: ExtractedApplianceData, dailyHours: number) => void;
}

export const ApplianceForm = ({ onAdd, onAddWithGeminiData }: ApplianceFormProps) => {
  const [name, setName] = useState("");
  const [powerWatts, setPowerWatts] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [category, setCategory] = useState("");
  const [useImageAnalysis, setUseImageAnalysis] = useState(false);


  const [geminiData, setGeminiData] = useState<ExtractedApplianceData | null>(null);

  const handleDataExtracted = (data: ExtractedApplianceData) => {
    // Llenar automáticamente los campos con los datos extraídos
    if (data.name) setName(data.name);
    if (data.power_watts) setPowerWatts(data.power_watts.toString());
    if (data.category) setCategory(data.category);
    setGeminiData(data);
    // Las horas de uso deben ser ingresadas por el usuario
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !powerWatts || !hoursPerDay || !category) return;

    // Si hay datos de Gemini y se proporciona el callback, usarlo
    if (geminiData && onAddWithGeminiData) {
      onAddWithGeminiData(geminiData, Number(hoursPerDay));
    } else {
      // Modo manual normal
      onAdd({
        name,
        powerWatts: Number(powerWatts),
        hoursPerDay: Number(hoursPerDay),
        category,
      });
    }

    setName("");
    setPowerWatts("");
    setHoursPerDay("");
    setCategory("");
    setUseImageAnalysis(false);
    setGeminiData(null);
  };

  return (
    <Card className="glass-card shadow-medium">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Plus className="h-5 w-5 text-primary" />
          Agregar Electrodoméstico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <Tabs value={useImageAnalysis ? "image" : "manual"} onValueChange={(v) => setUseImageAnalysis(v === "image")}>
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="manual" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Manual</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Desde Imagen</span>
              <span className="sm:hidden">Imagen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <ImageUploadAnalyzer onDataExtracted={handleDataExtracted} />
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 sm:p-4 rounded-lg">
              <p className="font-medium mb-1.5 sm:mb-2">Después de analizar la imagen:</p>
              <p className="leading-relaxed">
                Los datos se llenarán automáticamente. Solo necesitas ingresar las{' '}
                <strong>horas de uso diario</strong> y hacer clic en "Agregar".
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-3 sm:mt-4">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: Refrigerador Samsung"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="power" className="text-sm sm:text-base">Potencia (Watts)</Label>
                  <Input
                    id="power"
                    type="number"
                    placeholder="Ej: 150"
                    value={powerWatts}
                    onChange={(e) => setPowerWatts(e.target.value)}
                    min="1"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="hours" className="text-sm sm:text-base">Horas de uso diario</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    placeholder="Ej: 24"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(e.target.value)}
                    min="0"
                    max="24"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="category" className="text-sm sm:text-base">Categoría</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category" className="text-sm sm:text-base">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLIANCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm sm:text-base">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full text-sm sm:text-base py-2.5 sm:py-2">
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Formulario común que se muestra siempre (para cuando se usa análisis de imagen) */}
        {useImageAnalysis && (name || powerWatts || category) && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name-image" className="text-sm sm:text-base">Nombre</Label>
                <Input
                  id="name-image"
                  placeholder="Ej: Refrigerador Samsung"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="power-image" className="text-sm sm:text-base">Potencia (Watts)</Label>
                  <Input
                    id="power-image"
                    type="number"
                    placeholder="Ej: 150"
                    value={powerWatts}
                    onChange={(e) => setPowerWatts(e.target.value)}
                    min="1"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="hours-image" className="text-sm sm:text-base">
                    Horas de uso diario <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="hours-image"
                    type="number"
                    step="0.5"
                    placeholder="Ej: 24"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(e.target.value)}
                    min="0"
                    max="24"
                    required
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    * Ingresa las horas de uso diario
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="category-image" className="text-sm sm:text-base">Categoría</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category-image" className="text-sm sm:text-base">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLIANCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm sm:text-base">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full text-sm sm:text-base py-2.5 sm:py-2">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Electrodoméstico
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
