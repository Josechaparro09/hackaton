import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClimatePrediction, updateClimatePrediction } from '@/lib/supabase-queries';
import { toast } from 'sonner';
import type { ClimatePrediction } from '@/types/database';

const climatePredictionSchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  region: z.string().min(1, 'La región es requerida'),
  solar_radiation_kwh_m2: z.number().optional().nullable(),
  temperature_avg: z.number().optional().nullable(),
  cloud_coverage_percent: z.number().min(0).max(100).optional().nullable(),
  estimated_production_kwh: z.number().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

type ClimatePredictionFormData = z.infer<typeof climatePredictionSchema>;

interface ClimatePredictionFormProps {
  prediction?: ClimatePrediction | null;
  onSuccess: () => void;
}

export const ClimatePredictionForm = ({
  prediction,
  onSuccess,
}: ClimatePredictionFormProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClimatePredictionFormData>({
    resolver: zodResolver(climatePredictionSchema),
    defaultValues: {
      date: prediction?.date || new Date().toISOString().split('T')[0],
      region: prediction?.region || '',
      solar_radiation_kwh_m2: prediction?.solar_radiation_kwh_m2
        ? Number(prediction.solar_radiation_kwh_m2)
        : null,
      temperature_avg: prediction?.temperature_avg ? Number(prediction.temperature_avg) : null,
      cloud_coverage_percent: prediction?.cloud_coverage_percent
        ? Number(prediction.cloud_coverage_percent)
        : null,
      estimated_production_kwh: prediction?.estimated_production_kwh
        ? Number(prediction.estimated_production_kwh)
        : null,
      user_id: prediction?.user_id || null,
    },
  });

  useEffect(() => {
    if (prediction) {
      reset({
        date: prediction.date,
        region: prediction.region,
        solar_radiation_kwh_m2: prediction.solar_radiation_kwh_m2
          ? Number(prediction.solar_radiation_kwh_m2)
          : null,
        temperature_avg: prediction.temperature_avg ? Number(prediction.temperature_avg) : null,
        cloud_coverage_percent: prediction.cloud_coverage_percent
          ? Number(prediction.cloud_coverage_percent)
          : null,
        estimated_production_kwh: prediction.estimated_production_kwh
          ? Number(prediction.estimated_production_kwh)
          : null,
        user_id: prediction.user_id,
      });
    }
  }, [prediction, reset]);

  const createMutation = useMutation({
    mutationFn: createClimatePrediction,
    onSuccess: () => {
      toast.success('Predicción climática creada correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al crear predicción climática', {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClimatePrediction> }) =>
      updateClimatePrediction(id, data),
    onSuccess: () => {
      toast.success('Predicción climática actualizada correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar predicción climática', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ClimatePredictionFormData) => {
    const submitData = {
      ...data,
      solar_radiation_kwh_m2: data.solar_radiation_kwh_m2 || null,
      temperature_avg: data.temperature_avg || null,
      cloud_coverage_percent: data.cloud_coverage_percent || null,
      estimated_production_kwh: data.estimated_production_kwh || null,
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
          <Label htmlFor="date">Fecha *</Label>
          <Input id="date" type="date" {...register('date')} required />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Región *</Label>
          <Input id="region" {...register('region')} placeholder="Madrid" required />
          {errors.region && <p className="text-sm text-destructive">{errors.region.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="solar_radiation_kwh_m2">Radiación Solar (kWh/m²)</Label>
          <Input
            id="solar_radiation_kwh_m2"
            type="number"
            step="0.01"
            {...register('solar_radiation_kwh_m2', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature_avg">Temperatura Promedio (°C)</Label>
          <Input
            id="temperature_avg"
            type="number"
            step="0.1"
            {...register('temperature_avg', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cloud_coverage_percent">Cobertura Nubosa (%)</Label>
          <Input
            id="cloud_coverage_percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register('cloud_coverage_percent', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_production_kwh">Producción Estimada (kWh)</Label>
          <Input
            id="estimated_production_kwh"
            type="number"
            step="0.01"
            {...register('estimated_production_kwh', { valueAsNumber: true })}
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

