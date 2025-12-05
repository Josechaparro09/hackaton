import { Card, CardContent } from "@/components/ui/card";
import { ConsumptionSummary } from "@/types/appliance";
import { Zap, TrendingUp, Calendar } from "lucide-react";

export type PeriodFilter = "daily" | "weekly" | "monthly";

interface ConsumptionDashboardProps {
  summary: ConsumptionSummary;
  periodFilter?: PeriodFilter;
}

export const ConsumptionDashboard = ({ summary, periodFilter = "daily" }: ConsumptionDashboardProps) => {
  const getFilteredValue = () => {
    switch (periodFilter) {
      case "weekly":
        return {
          kwh: summary.dailyKwh * 7,
          cost: summary.dailyCost * 7,
          title: "Consumo Semanal",
        };
      case "monthly":
        return {
          kwh: summary.monthlyKwh,
          cost: summary.monthlyCost,
          title: "Consumo Mensual",
        };
      default:
        return {
          kwh: summary.dailyKwh,
          cost: summary.dailyCost,
          title: "Consumo Diario",
        };
    }
  };

  const filtered = getFilteredValue();

  const stats = [
    {
      title: filtered.title,
      value: filtered.kwh.toFixed(2),
      unit: "kWh",
      cost: filtered.cost.toFixed(2),
      icon: periodFilter === "weekly" ? Calendar : periodFilter === "monthly" ? Calendar : Zap,
      gradient: periodFilter === "weekly" ? "from-blue-500 to-cyan-500" : periodFilter === "monthly" ? "from-indigo-500 to-purple-500" : "from-emerald-500 to-teal-500",
    },
    {
      title: "Consumo Mensual",
      value: summary.monthlyKwh.toFixed(2),
      unit: "kWh",
      cost: summary.monthlyCost.toFixed(2),
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Consumo Anual",
      value: summary.yearlyKwh.toFixed(2),
      unit: "kWh",
      cost: summary.yearlyCost.toFixed(2),
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="glass-card shadow-medium overflow-hidden hover:shadow-lg transition-smooth"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <span className="text-sm text-muted-foreground">{stat.unit}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              {stat.cost !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">${stat.cost}</span>
                  <span className="text-muted-foreground">costo estimado</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
