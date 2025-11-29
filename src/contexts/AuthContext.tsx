import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ensureProfileExists } from '@/lib/supabase-queries';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionLoaded = false;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      initialSessionLoaded = true;
      
      // Establecer loading a false primero, luego verificar perfil en background
      setLoading(false);
      
      // Verificar perfil en background (no bloquea la carga)
      if (session?.user) {
        ensureProfileExists(session.user.id).catch((profileError) => {
          console.error('Error al crear/verificar perfil:', profileError);
          // Error silencioso, no bloquea la app
        });
      }
    }).catch((error) => {
      console.error('Error al obtener sesión:', error);
      if (mounted) {
        setLoading(false);
        initialSessionLoaded = true;
      }
    });

    // Listen for auth changes (solo después de la carga inicial)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted || !initialSessionLoaded) return;

      setSession(session);
      setUser(session?.user ?? null);
      
      // Verificar perfil en background cuando cambia el estado de autenticación
      if (session?.user) {
        ensureProfileExists(session.user.id).catch((profileError) => {
          console.error('Error al crear/verificar perfil:', profileError);
          // Error silencioso, no bloquea la app
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Error al iniciar sesión', {
        description: error.message,
      });
      throw error;
    }

    // Asegurar que existe un perfil para el usuario
    if (data.user) {
      try {
        await ensureProfileExists(data.user.id);
      } catch (profileError) {
        console.error('Error al crear/verificar perfil:', profileError);
        // No lanzamos el error para no bloquear el login, pero lo registramos
      }
    }

    toast.success('Sesión iniciada correctamente');
    setSession(data.session);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error('Error al registrarse', {
        description: error.message,
      });
      throw error;
    }

    // Crear perfil automáticamente cuando se registra un nuevo usuario
    if (data.user) {
      try {
        await ensureProfileExists(data.user.id);
      } catch (profileError) {
        console.error('Error al crear perfil:', profileError);
        toast.error('Error al crear perfil', {
          description: 'La cuenta se creó pero hubo un problema al crear el perfil. Por favor, contacta al soporte.',
        });
        // No lanzamos el error para permitir que el usuario continúe
      }
    }

    toast.success('Cuenta creada correctamente', {
      description: 'Por favor, verifica tu email',
    });
    setSession(data.session);
    setUser(data.user);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión', {
        description: error.message,
      });
      throw error;
    }

    toast.success('Sesión cerrada correctamente');
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

