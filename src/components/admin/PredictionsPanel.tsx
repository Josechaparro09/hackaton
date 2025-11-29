import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DataTable } from './DataTable';
import { PredictionForm } from './PredictionForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPredictions, deletePrediction } from '@/lib/supabase-queries';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Prediction } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const PredictionsPanel = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);
  const queryClient = useQueryClient();

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: getPredictions,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.success('Predicción eliminada correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar predicción', {
        description: error.message,
      });
    },
  });

  const handleAdd = () => {
    setEditingPrediction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (prediction: Prediction) => {
    setEditingPrediction(prediction);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta predicción?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Predicciones</h1>
          <p className="text-muted-foreground">Administra las predicciones de energía solar</p>
        </div>

        <DataTable
          title="Predicciones"
          data={predictions}
          loading={isLoading}
          onAdd={handleAdd}
          emptyMessage="No hay predicciones registradas"
          renderRow={(prediction) => (
            <div
              key={prediction.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">Predicción de Energía Solar</h4>
                  <Badge variant="secondary">
                    {prediction.recommended_solar_panels} paneles
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      {Number(prediction.total_daily_consumption_kwh).toFixed(2)} kWh
                    </span>
                    <br />
                    <span className="text-xs">Consumo diario</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {Number(prediction.total_monthly_consumption_kwh).toFixed(2)} kWh
                    </span>
                    <br />
                    <span className="text-xs">Consumo mensual</span>
                  </div>
                  <div>
                    <span className="font-medium text-primary">
                      {prediction.panel_wattage}W
                    </span>
                    <br />
                    <span className="text-xs">Potencia panel</span>
                  </div>
                  {prediction.estimated_cost && (
                    <div>
                      <span className="font-medium text-foreground">
                        ${Number(prediction.estimated_cost).toFixed(2)}
                      </span>
                      <br />
                      <span className="text-xs">Costo estimado</span>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPrediction ? 'Editar Predicción' : 'Nueva Predicción'}
              </DialogTitle>
            </DialogHeader>
            <PredictionForm
              prediction={editingPrediction}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingPrediction(null);
                queryClient.invalidateQueries({ queryKey: ['predictions'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

