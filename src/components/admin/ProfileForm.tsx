import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProfile, updateProfile } from '@/lib/supabase-queries';
import { toast } from 'sonner';
import type { Profile } from '@/types/database';

const profileSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido').optional().nullable(),
  region: z.string().min(1, 'La región es requerida'),
  city: z.string().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: Profile | null;
  onSuccess: () => void;
}

export const ProfileForm = ({ profile, onSuccess }: ProfileFormProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      region: profile?.region || '',
      city: profile?.city || '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        region: profile.region,
        city: profile.city || '',
      });
    }
  }, [profile, reset]);

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      toast.success('Perfil creado correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al crear perfil', {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) => updateProfile(id, data),
    onSuccess: () => {
      toast.success('Perfil actualizado correctamente');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar perfil', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    if (profile) {
      updateMutation.mutate({ id: profile.id, data });
    } else {
      createMutation.mutate({
        full_name: data.full_name || null,
        region: data.region,
        city: data.city || null,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre Completo</Label>
        <Input id="full_name" {...register('full_name')} placeholder="Juan Pérez" />
        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Región *</Label>
        <Input id="region" {...register('region')} placeholder="Madrid" required />
        {errors.region && <p className="text-sm text-destructive">{errors.region.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ciudad</Label>
        <Input id="city" {...register('city')} placeholder="Madrid" />
        {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {profile ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

