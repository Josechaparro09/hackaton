import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DataTable } from './DataTable';
import { ClimatePredictionForm } from './ClimatePredictionForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClimatePredictions, deleteClimatePrediction } from '@/lib/supabase-queries';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ClimatePrediction } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const ClimatePredictionsPanel = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<ClimatePrediction | null>(null);
  const queryClient = useQueryClient();

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['climate-predictions'],
    queryFn: getClimatePredictions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClimatePrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climate-predictions'] });
      toast.success('Predicción climática eliminada correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar predicción climática', {
        description: error.message,
      });
    },
  });

  const handleAdd = () => {
    setEditingPrediction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (prediction: ClimatePrediction) => {
    setEditingPrediction(prediction);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta predicción climática?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Predicciones Climáticas</h1>
          <p className="text-muted-foreground">Administra las predicciones climáticas</p>
        </div>

        <DataTable
          title="Predicciones Climáticas"
          data={predictions}
          loading={isLoading}
          onAdd={handleAdd}
          emptyMessage="No hay predicciones climáticas registradas"
          renderRow={(prediction) => (
            <div
              key={prediction.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">Predicción Climática</h4>
                  <Badge variant="secondary">{prediction.region}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      {format(new Date(prediction.date), 'dd/MM/yyyy')}
                    </span>
                    <br />
                    <span className="text-xs">Fecha</span>
                  </div>
                  {prediction.solar_radiation_kwh_m2 !== null && (
                    <div>
                      <span className="font-medium text-primary">
                        {Number(prediction.solar_radiation_kwh_m2).toFixed(2)} kWh/m²
                      </span>
                      <br />
                      <span className="text-xs">Radiación solar</span>
                    </div>
                  )}
                  {prediction.temperature_avg !== null && (
                    <div>
                      <span className="font-medium text-foreground">
                        {Number(prediction.temperature_avg).toFixed(1)}°C
                      </span>
                      <br />
                      <span className="text-xs">Temperatura promedio</span>
                    </div>
                  )}
                  {prediction.cloud_coverage_percent !== null && (
                    <div>
                      <span className="font-medium text-foreground">
                        {Number(prediction.cloud_coverage_percent).toFixed(1)}%
                      </span>
                      <br />
                      <span className="text-xs">Cobertura nubosa</span>
                    </div>
                  )}
                  {prediction.estimated_production_kwh !== null && (
                    <div>
                      <span className="font-medium text-primary">
                        {Number(prediction.estimated_production_kwh).toFixed(2)} kWh
                      </span>
                      <br />
                      <span className="text-xs">Producción estimada</span>
                    </div>
                  )}
                </div>
                {prediction.created_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Creado: {format(new Date(prediction.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(prediction)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(prediction.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrediction ? 'Editar Predicción Climática' : 'Nueva Predicción Climática'}
              </DialogTitle>
            </DialogHeader>
            <ClimatePredictionForm
              prediction={editingPrediction}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingPrediction(null);
                queryClient.invalidateQueries({ queryKey: ['climate-predictions'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

