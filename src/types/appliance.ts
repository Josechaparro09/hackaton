export interface Appliance {
  id: string;
  name: string;
  powerWatts: number;
  hoursPerDay: number;
  category: string;
}

export interface ConsumptionSummary {
  dailyKwh: number;
  monthlyKwh: number;
  yearlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
}
