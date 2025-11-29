import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DataTable } from './DataTable';
import { ApplianceForm } from './ApplianceForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppliances, deleteAppliance } from '@/lib/supabase-queries';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Appliance } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const AppliancesPanel = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const queryClient = useQueryClient();

  const { data: appliances = [], isLoading } = useQuery({
    queryKey: ['appliances'],
    queryFn: getAppliances,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppliance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliances'] });
      toast.success('Electrodoméstico eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar electrodoméstico', {
        description: error.message,
      });
    },
  });

  const handleAdd = () => {
    setEditingAppliance(null);
    setIsFormOpen(true);
  };

  const handleEdit = (appliance: Appliance) => {
    setEditingAppliance(appliance);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este electrodoméstico?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Electrodomésticos</h1>
          <p className="text-muted-foreground">Administra los electrodomésticos registrados</p>
        </div>

        <DataTable
          title="Electrodomésticos"
          data={appliances}
          loading={isLoading}
          onAdd={handleAdd}
          emptyMessage="No hay electrodomésticos registrados"
          renderRow={(appliance) => {
            const dailyKwh = (appliance.power_watts * appliance.daily_hours) / 1000;
            return (
              <div
                key={appliance.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{appliance.name}</h4>
                    <Badge variant="secondary">{appliance.category}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{appliance.power_watts}W</span>
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{appliance.daily_hours}h</span> al día
                    </span>
                    <span>
                      <span className="font-medium text-primary">{dailyKwh.toFixed(2)} kWh</span> diarios
                    </span>
                    {appliance.quantity && appliance.quantity > 1 && (
                      <span>Cantidad: {appliance.quantity}</span>
                    )}
                    {appliance.created_at && (
                      <span>Creado: {format(new Date(appliance.created_at), 'dd/MM/yyyy')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(appliance)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(appliance.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          }}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAppliance ? 'Editar Electrodoméstico' : 'Nuevo Electrodoméstico'}
              </DialogTitle>
            </DialogHeader>
            <ApplianceForm
              appliance={editingAppliance}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingAppliance(null);
                queryClient.invalidateQueries({ queryKey: ['appliances'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

