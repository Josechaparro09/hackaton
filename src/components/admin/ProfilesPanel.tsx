import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DataTable } from './DataTable';
import { ProfileForm } from './ProfileForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfiles, deleteProfile } from '@/lib/supabase-queries';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Profile } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const ProfilesPanel = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Perfil eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar perfil', {
        description: error.message,
      });
    },
  });

  const handleAdd = () => {
    setEditingProfile(null);
    setIsFormOpen(true);
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este perfil?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Perfiles</h1>
          <p className="text-muted-foreground">Administra los perfiles de usuario</p>
        </div>

        <DataTable
          title="Perfiles"
          data={profiles}
          loading={isLoading}
          onAdd={handleAdd}
          emptyMessage="No hay perfiles registrados"
          renderRow={(profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-smooth"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{profile.full_name || 'Sin nombre'}</h4>
                  <Badge variant="secondary">{profile.region}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>ID: {profile.id.substring(0, 8)}...</span>
                  {profile.city && <span>Ciudad: {profile.city}</span>}
                  {profile.created_at && (
                    <span>Creado: {format(new Date(profile.created_at), 'dd/MM/yyyy')}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(profile.id)}
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
              <DialogTitle>{editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}</DialogTitle>
            </DialogHeader>
            <ProfileForm
              profile={editingProfile}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingProfile(null);
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

