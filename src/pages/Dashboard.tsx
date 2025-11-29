import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users, Zap, Cloud } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  getProfiles,
  getAppliances,
  getPredictions,
  getClimatePredictions,
} from '@/lib/supabase-queries';

const Dashboard = () => {
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  const { data: appliances } = useQuery({
    queryKey: ['appliances'],
    queryFn: getAppliances,
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: getPredictions,
  });

  const { data: climatePredictions } = useQuery({
    queryKey: ['climate-predictions'],
    queryFn: getClimatePredictions,
  });

  const stats = [
    {
      title: 'Perfiles',
      value: profiles?.length || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      href: '/admin/profiles',
    },
    {
      title: 'Electrodomésticos',
      value: appliances?.length || 0,
      icon: Zap,
      gradient: 'from-emerald-500 to-teal-500',
      href: '/admin/appliances',
    },
    {
      title: 'Predicciones',
      value: predictions?.length || 0,
      icon: Database,
      gradient: 'from-violet-500 to-purple-500',
      href: '/admin/predictions',
    },
    {
      title: 'Predicciones Climáticas',
      value: climatePredictions?.length || 0,
      icon: Cloud,
      gradient: 'from-orange-500 to-red-500',
      href: '/admin/climate-predictions',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="glass-card shadow-medium hover:shadow-lg transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registros totales</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

