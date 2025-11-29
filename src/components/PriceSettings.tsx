import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface PriceSettingsProps {
  pricePerKwh: number;
  onPriceChange: (price: number) => void;
}

export const PriceSettings = ({ pricePerKwh, onPriceChange }: PriceSettingsProps) => {
  return (
    <Card className="glass-card shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-primary" />
          Precio por kWh
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm">
            Configura el precio de la electricidad en tu zona
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={pricePerKwh}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            className="text-lg font-medium"
          />
          <p className="text-xs text-muted-foreground">
            El precio promedio en España es aproximadamente €0.15/kWh
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
