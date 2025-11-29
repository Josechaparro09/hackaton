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
import { Plus } from "lucide-react";
import { Appliance } from "@/types/appliance";
import { APPLIANCE_CATEGORIES } from "@/utils/consumptionCalculator";

interface ApplianceFormProps {
  onAdd: (appliance: Omit<Appliance, "id">) => void;
}

export const ApplianceForm = ({ onAdd }: ApplianceFormProps) => {
  const [name, setName] = useState("");
  const [powerWatts, setPowerWatts] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !powerWatts || !hoursPerDay || !category) return;

    onAdd({
      name,
      powerWatts: Number(powerWatts),
      hoursPerDay: Number(hoursPerDay),
      category,
    });

    setName("");
    setPowerWatts("");
    setHoursPerDay("");
    setCategory("");
  };

  return (
    <Card className="glass-card shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Agregar Electrodoméstico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Refrigerador Samsung"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="power">Potencia (Watts)</Label>
              <Input
                id="power"
                type="number"
                placeholder="Ej: 150"
                value={powerWatts}
                onChange={(e) => setPowerWatts(e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Horas de uso diario</Label>
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {APPLIANCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
