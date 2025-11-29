import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPrediction, updatePrediction } from '@/lib/supabase-queries';
import { toast } from 'sonner';
import type { Prediction } from '@/types/database';

const predictionSchema = z.object({
  total_daily_consumption_kwh: z.number().min(0, 'El consumo diario debe ser mayor o igual a 0'),
  total_monthly_consumption_kwh: z.number().min(0, 'El consumo mensual debe ser mayor o igual a 0'),
  recommended_solar_panels: z.number().min(1, 'Debe haber al menos 1 panel'),
  panel_wattage: z.number().min(1, 'La potencia del panel debe ser mayor a 0'),
  battery_capacity_kwh: z.number().min(0, 'La capacidad de la batería debe ser mayor o igual a 0'),
  inverter_capacity_kw: z.number().min(0, 'La capacidad del inversor debe ser mayor o igual a 0'),
  estimated_cost: z.number().optional().nullable(),
  savings_yearly: z.number().optional().nullable(),
  payback_period_years: z.number().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

interface PredictionFormProps {
  prediction?: Prediction | null;
  onSuccess: () => void;
}

export const PredictionForm = ({ prediction, onSuccess }: PredictionFormProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      total_daily_consumption_kwh: prediction ? Number(prediction.total_daily_consumption_kwh) : 0,
      total_monthly_consumption_kwh: prediction ? Number(prediction.total_monthly_consumption_kwh) : 0,
      recommended_solar_panels: prediction?.recommended_solar_panels || 1,
      panel_wattage: prediction?.panel_wattage || 0,
      battery_capacity_kwh: prediction ? Number(prediction.battery_capacity_kwh) : 0,
      inverter_capacity_kw: prediction ? Number(prediction.inverter_capacity_kw) : 0,
      estimated_cost: prediction ? Number(prediction.estimated_cost) : null,
      savings_yearly: prediction ? Number(prediction.savings_yearly) : null,
      payback_period_years: prediction ? Number(prediction.payback_period_years) : null,
      user_id: prediction?.user_id || null,
    },
  });

  useEffect(() => {
    if (prediction) {
      reset({
        total_daily_consumption_kwh: Number(prediction.total_daily_consumption_kwh),
        total_monthly_consumption_kwh: Number(prediction.total_monthly_consumption_kwh),
        recommended_solar_panels: prediction.recommended_solar_panels,
        panel_wattage: prediction.panel_wattage,
        battery_capacity_kwh: Number(prediction.battery_capacity_kwh),
        inverter_capacity_kw: Number(prediction.inverter_capacity_kw),
        estimated_cost: prediction.estimated_cost ? Number(prediction.estimated_cost) : null,
        savings_yearly: prediction.savings_yearly ? Number(prediction.savings_yearly) : null,
        payback_period_years: prediction.payback_period_years
          ? Number(prediction.payback_period_years)
          : null,
        user_id: prediction.user_id,
      });
    }
  }, [prediction, reset]);

  const createMutation = useMutation({
    mutationFn: createPrediction,
    onSuccess: () => {
      toast.success('Predicción creada correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al crear predicción', {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Prediction> }) =>
      updatePrediction(id, data),
    onSuccess: () => {
      toast.success('Predicción actualizada correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar predicción', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: PredictionFormData) => {
    const submitData = {
      ...data,
      estimated_cost: data.estimated_cost || null,
      savings_yearly: data.savings_yearly || null,
      payback_period_years: data.payback_period_years || null,
    };

    if (prediction) {
      updateMutation.mutate({ id: prediction.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_daily_consumption_kwh">Consumo Diario (kWh) *</Label>
          <Input
            id="total_daily_consumption_kwh"
            type="number"
            step="0.01"
            {...register('total_daily_consumption_kwh', { valueAsNumber: true })}
            required
          />
          {errors.total_daily_consumption_kwh && (
            <p className="text-sm text-destructive">{errors.total_daily_consumption_kwh.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_monthly_consumption_kwh">Consumo Mensual (kWh) *</Label>
          <Input
            id="total_monthly_consumption_kwh"
            type="number"
            step="0.01"
            {...register('total_monthly_consumption_kwh', { valueAsNumber: true })}
            required
          />
          {errors.total_monthly_consumption_kwh && (
            <p className="text-sm text-destructive">{errors.total_monthly_consumption_kwh.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recommended_solar_panels">Paneles Solares Recomendados *</Label>
          <Input
            id="recommended_solar_panels"
            type="number"
            {...register('recommended_solar_panels', { valueAsNumber: true })}
            min="1"
            required
          />
          {errors.recommended_solar_panels && (
            <p className="text-sm text-destructive">{errors.recommended_solar_panels.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="panel_wattage">Potencia del Panel (W) *</Label>
          <Input
            id="panel_wattage"
            type="number"
            {...register('panel_wattage', { valueAsNumber: true })}
            min="1"
            required
          />
          {errors.panel_wattage && (
            <p className="text-sm text-destructive">{errors.panel_wattage.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="battery_capacity_kwh">Capacidad de Batería (kWh) *</Label>
          <Input
            id="battery_capacity_kwh"
            type="number"
            step="0.01"
            {...register('battery_capacity_kwh', { valueAsNumber: true })}
            min="0"
            required
          />
          {errors.battery_capacity_kwh && (
            <p className="text-sm text-destructive">{errors.battery_capacity_kwh.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inverter_capacity_kw">Capacidad del Inversor (kW) *</Label>
          <Input
            id="inverter_capacity_kw"
            type="number"
            step="0.01"
            {...register('inverter_capacity_kw', { valueAsNumber: true })}
            min="0"
            required
          />
          {errors.inverter_capacity_kw && (
            <p className="text-sm text-destructive">{errors.inverter_capacity_kw.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_cost">Costo Estimado ($)</Label>
          <Input
            id="estimated_cost"
            type="number"
            step="0.01"
            {...register('estimated_cost', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="savings_yearly">Ahorro Anual ($)</Label>
          <Input
            id="savings_yearly"
            type="number"
            step="0.01"
            {...register('savings_yearly', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payback_period_years">Período de Recuperación (años)</Label>
          <Input
            id="payback_period_years"
            type="number"
            step="0.01"
            {...register('payback_period_years', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {prediction ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

