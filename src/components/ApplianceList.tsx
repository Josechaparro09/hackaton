import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Zap } from "lucide-react";
import { Appliance } from "@/types/appliance";

interface ApplianceListProps {
  appliances: Appliance[];
  onDelete: (id: string) => void;
}

export const ApplianceList = ({ appliances, onDelete }: ApplianceListProps) => {
  if (appliances.length === 0) {
    return (
      <Card className="glass-card shadow-medium">
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay electrodomésticos agregados aún</p>
            <p className="text-sm mt-2">Agrega tu primer electrodoméstico para comenzar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-medium">
      <CardHeader>
        <CardTitle>Mis Electrodomésticos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appliances.map((appliance) => {
            const dailyKwh = (appliance.powerWatts * appliance.hoursPerDay) / 1000;
            
            return (
              <div
                key={appliance.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{appliance.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {appliance.category}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{appliance.powerWatts}W</span>
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{appliance.hoursPerDay}h</span> al día
                    </span>
                    <span>
                      <span className="font-medium text-primary">{dailyKwh.toFixed(2)} kWh</span> diarios
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(appliance.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
