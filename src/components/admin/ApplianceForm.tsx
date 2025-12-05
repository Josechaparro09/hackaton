import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAppliance, updateAppliance } from '@/lib/supabase-queries';
import { toast } from 'sonner';
import type { Appliance } from '@/types/database';
import { APPLIANCE_CATEGORIES } from '@/utils/consumptionCalculator';
import { ImageUploadAnalyzer } from '@/components/ImageUploadAnalyzer';
import { geminiDataToDB } from '@/utils/geminiConverter';
import type { ExtractedApplianceData } from '@/lib/gemini-service';
import { Upload, PenTool } from 'lucide-react';

const applianceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  power_watts: z.number().min(1, 'La potencia debe ser mayor a 0'),
  daily_hours: z.number().min(0).max(24, 'Las horas deben estar entre 0 y 24'),
  quantity: z.number().min(1).optional().nullable(),
});

type ApplianceFormData = z.infer<typeof applianceSchema>;

interface ApplianceFormProps {
  appliance?: Appliance | null;
  onSuccess: () => void;
}

export const ApplianceForm = ({ appliance, onSuccess }: ApplianceFormProps) => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(appliance?.category || '');
  const [useImageAnalysis, setUseImageAnalysis] = useState(false);
  const [geminiData, setGeminiData] = useState<ExtractedApplianceData | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ApplianceFormData>({
    resolver: zodResolver(applianceSchema),
    defaultValues: {
      name: appliance?.name || '',
      category: appliance?.category || '',
      power_watts: appliance?.power_watts || 0,
      daily_hours: Number(appliance?.daily_hours) || 0,
      quantity: appliance?.quantity || 1,
    },
  });

  const watchedName = watch('name');
  const watchedPowerWatts = watch('power_watts');
  const watchedCategory = watch('category');

  useEffect(() => {
    if (appliance) {
      reset({
        name: appliance.name,
        category: appliance.category,
        power_watts: appliance.power_watts,
        daily_hours: Number(appliance.daily_hours),
        quantity: appliance.quantity || 1,
      });
      setCategory(appliance.category);
    }
  }, [appliance, reset]);

  const createMutation = useMutation({
    mutationFn: createAppliance,
    onSuccess: () => {
      toast.success('Electrodoméstico creado correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al crear electrodoméstico', {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appliance> }) => updateAppliance(id, data),
    onSuccess: () => {
      toast.success('Electrodoméstico actualizado correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar electrodoméstico', {
        description: error.message,
      });
    },
  });

  const handleDataExtracted = (data: ExtractedApplianceData) => {
    // Llenar automáticamente los campos con los datos extraídos
    if (data.name) setValue('name', data.name);
    if (data.power_watts) setValue('power_watts', data.power_watts);
    if (data.category) {
      setCategory(data.category);
      setValue('category', data.category);
    }
    setGeminiData(data);
  };

  const onSubmit = (data: ApplianceFormData) => {
    // Si hay datos de Gemini y es creación nueva, usarlos
    if (geminiData && !appliance) {
      const dbData = geminiDataToDB(geminiData, data.daily_hours);
      createMutation.mutate(dbData);
      setGeminiData(null);
      return;
    }

    const submitData = {
      name: data.name,
      category,
      power_watts: data.power_watts,
      daily_hours: data.daily_hours,
      quantity: data.quantity || 1,
    };

    if (appliance) {
      updateMutation.mutate({ id: appliance.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Si está editando, no mostrar tabs
  if (appliance) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register('name')} placeholder="Refrigerador Samsung" required />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Select value={category} onValueChange={(value) => {
            setCategory(value);
            setValue('category', value);
          }}>
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
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="power_watts">Potencia (Watts) *</Label>
            <Input
              id="power_watts"
              type="number"
              {...register('power_watts', { valueAsNumber: true })}
              placeholder="150"
              min="1"
              required
            />
            {errors.power_watts && (
              <p className="text-sm text-destructive">{errors.power_watts.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_hours">Horas diarias *</Label>
            <Input
              id="daily_hours"
              type="number"
              step="0.5"
              {...register('daily_hours', { valueAsNumber: true })}
              placeholder="24"
              min="0"
              max="24"
              required
            />
            {errors.daily_hours && (
              <p className="text-sm text-destructive">{errors.daily_hours.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            {...register('quantity', { valueAsNumber: true })}
            placeholder="1"
            min="1"
          />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {appliance ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    );
  }

  // Formulario para crear nuevo con tabs
  return (
    <div className="space-y-4">
      <Tabs value={useImageAnalysis ? "image" : "manual"} onValueChange={(v) => setUseImageAnalysis(v === "image")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="gap-2">
            <PenTool className="h-4 w-4" />
            <span>Manual</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-2">
            <Upload className="h-4 w-4" />
            <span>Desde Imagen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-4 mt-4">
          <ImageUploadAnalyzer onDataExtracted={handleDataExtracted} />
          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-2">Después de analizar la imagen:</p>
            <p className="leading-relaxed">
              Los datos se llenarán automáticamente. Solo necesitas ingresar las{' '}
              <strong>horas de uso diario</strong> y hacer clic en "Crear".
            </p>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register('name')} placeholder="Refrigerador Samsung" required />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={category} onValueChange={(value) => {
                setCategory(value);
                setValue('category', value);
              }}>
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
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="power_watts">Potencia (Watts) *</Label>
                <Input
                  id="power_watts"
                  type="number"
                  {...register('power_watts', { valueAsNumber: true })}
                  placeholder="150"
                  min="1"
                  required
                />
                {errors.power_watts && (
                  <p className="text-sm text-destructive">{errors.power_watts.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily_hours">Horas diarias *</Label>
                <Input
                  id="daily_hours"
                  type="number"
                  step="0.5"
                  {...register('daily_hours', { valueAsNumber: true })}
                  placeholder="24"
                  min="0"
                  max="24"
                  required
                />
                {errors.daily_hours && (
                  <p className="text-sm text-destructive">{errors.daily_hours.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="1"
                min="1"
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Crear
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Formulario común que se muestra siempre (para cuando se usa análisis de imagen) */}
      {useImageAnalysis && (watchedName || watchedPowerWatts || watchedCategory) && (
        <div className="mt-4 pt-4 border-t">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-image">Nombre *</Label>
              <Input id="name-image" {...register('name')} placeholder="Refrigerador Samsung" required />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="power-image">Potencia (Watts) *</Label>
                <Input
                  id="power-image"
                  type="number"
                  {...register('power_watts', { valueAsNumber: true })}
                  placeholder="150"
                  min="1"
                  required
                />
                {errors.power_watts && (
                  <p className="text-sm text-destructive">{errors.power_watts.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours-image">
                  Horas de uso diario <span className="text-primary">*</span>
                </Label>
                <Input
                  id="hours-image"
                  type="number"
                  step="0.5"
                  {...register('daily_hours', { valueAsNumber: true })}
                  placeholder="24"
                  min="0"
                  max="24"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  * Ingresa las horas de uso diario
                </p>
                {errors.daily_hours && (
                  <p className="text-sm text-destructive">{errors.daily_hours.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-image">Categoría *</Label>
              <Select value={category} onValueChange={(value) => {
                setCategory(value);
                setValue('category', value);
              }}>
                <SelectTrigger id="category-image">
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
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Crear Electrodoméstico
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

