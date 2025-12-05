import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Zap,
  Sun,
  Calculator,
  DollarSign,
  BarChart3,
  Cloud,
  Users,
  ArrowRight,
  LogIn,
  UserPlus,
  Home,
} from "lucide-react";

const Landing = () => {
  const { user } = useAuth();
  
  const features = [
    {
      icon: Calculator,
      title: "Calculadora de Consumo",
      description: "Calcula el consumo eléctrico diario, mensual y anual de todos tus electrodomésticos con precisión.",
      gradient: "from-emerald-500 to-teal-500",
      image: "/pan2.png",
      imageAlt: "Paneles solares en instalación residencial",
    },
    {
      icon: DollarSign,
      title: "Estimación de Costos",
      description: "Obtén estimaciones precisas de tus gastos eléctricos según el precio por kWh de tu zona.",
      gradient: "from-blue-500 to-cyan-500",
      image: "/pan1.png",
      imageAlt: "Paneles solares con análisis financiero",
    },
    {
      icon: Sun,
      title: "Producción Solar",
      description: "Visualiza y analiza la producción de energía solar por departamento y mes.",
      gradient: "from-orange-500 to-yellow-500",
      image: "/pan2.png",
      imageAlt: "Granja solar con paneles solares",
    },
    {
      icon: BarChart3,
      title: "Dashboard Interactivo",
      description: "Métricas visuales y gráficos que te ayudan a entender tu consumo energético.",
      gradient: "from-violet-500 to-purple-500",
      image: "/pan1.png",
      imageAlt: "Paneles solares modernos con tecnología avanzada",
    },
    {
      icon: Cloud,
      title: "Predicciones Climáticas",
      description: "Accede a predicciones climáticas que ayudan a optimizar tu consumo energético.",
      gradient: "from-sky-500 to-blue-500",
      image: "/pan2.png",
      imageAlt: "Paneles solares con cielo nublado",
    },
    {
      icon: Users,
      title: "Gestión de Perfiles",
      description: "Crea y gestiona múltiples perfiles de consumo para diferentes escenarios.",
      gradient: "from-pink-500 to-rose-500",
      image: "/pan1.png",
      imageAlt: "Instalación de paneles solares en techo",
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Imagen de fondo difuminada */}
      <div className="fixed inset-0 z-0">
        <img
          src="/pan1.png"
          alt="Paneles solares de fondo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-teal-800/70 to-cyan-900/70 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      {/* Contenido sobre el fondo */}
      <div className="relative z-10">
      {/* Header con botones de navegación */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/favicon.svg" 
                alt="EcoWatt Logo" 
                className="h-10 w-auto"
              />
              <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                EcoWatt
              </span>
            </Link>
            <div className="flex gap-3">
              {user ? (
                <Link to="/home">
                  <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    <Home className="h-4 w-4" />
                    Inicio
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" className="gap-2 border-emerald-300 hover:bg-emerald-50">
                      <LogIn className="h-4 w-4" />
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <UserPlus className="h-4 w-4" />
                      Registrarse
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
        <div className="text-center px-8 py-20 md:py-28 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img 
              src="/favicon.svg" 
              alt="EcoWatt Logo" 
              className="h-20 w-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white drop-shadow-2xl">
            EcoWatt
          </h1>
          <p className="text-2xl md:text-3xl text-white/95 mb-6 drop-shadow-lg">
            Calculadora de Consumo Eléctrico
          </p>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 drop-shadow-md">
            Optimiza tu consumo energético, calcula costos y toma decisiones inteligentes sobre
            tus electrodomésticos. Todo en una plataforma moderna y fácil de usar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/home">
                <Button size="lg" className="gap-2 text-lg px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl">
                  Ir al Inicio
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="gap-2 text-lg px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl">
                  Comenzar Ahora
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link to="/solar-production">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 bg-white/90 backdrop-blur-md border-2 border-white/50 text-emerald-700 hover:bg-white shadow-xl">
                <Sun className="h-5 w-5" />
                Ver Producción Solar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">Características Principales</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Descubre todas las herramientas que EcoWatt ofrece para gestionar tu consumo energético
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl hover:shadow-emerald-500/30 hover:border-white/50 transition-all duration-500 hover:scale-[1.02] rounded-2xl"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Imagen de fondo con overlay */}
                <div className="relative h-48 overflow-hidden rounded-t-2xl">
                  <img
                    src={feature.image}
                    alt={feature.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className={`absolute top-4 right-4 p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg backdrop-blur-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {/* Contenido */}
                <CardHeader className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/20">
                  <CardTitle className="text-xl mb-2 text-white drop-shadow-lg group-hover:text-emerald-200 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed text-white/90 drop-shadow-md">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                
                {/* Efecto de brillo al hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-15 blur-2xl`} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>


      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="p-12 md:p-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
              <Zap className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
            ¿Listo para optimizar tu consumo?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Comienza a usar EcoWatt ahora y toma el control de tu consumo eléctrico
          </p>
          {user ? (
            <Link to="/home">
              <Button size="lg" className="gap-2 text-lg px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                Ir al Inicio
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="lg" className="gap-2 text-lg px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                Comenzar Gratis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8 mt-16 bg-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-primary">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white drop-shadow-md">
                EcoWatt
              </span>
            </div>
            <p className="text-sm text-white/80 text-center md:text-right drop-shadow-sm">
              © 2024 EcoWatt. Calculadora de Consumo Eléctrico.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Landing;