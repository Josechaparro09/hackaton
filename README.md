# EcoWatt - Calculadora de Consumo Eléctrico

Aplicación web para calcular y optimizar el consumo eléctrico de tus electrodomésticos.

## Características

- ✅ Agregar y gestionar electrodomésticos
- ✅ Calcular consumo diario, mensual y anual
- ✅ Estimar costos según precio por kWh
- ✅ Dashboard con métricas visuales
- ✅ Interfaz moderna y responsive

## Tecnologías

Este proyecto está construido con:

- **Vite** - Build tool y dev server
- **React** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **React Router** - Enrutamiento

## Instalación

```sh
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── pages/          # Páginas de la aplicación
├── types/          # Definiciones TypeScript
├── utils/          # Utilidades y helpers
└── lib/            # Librerías auxiliares
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo en el puerto 8080
- `npm run build` - Crea un build optimizado para producción
- `npm run build:dev` - Crea un build en modo desarrollo
- `npm run lint` - Ejecuta el linter
- `npm run preview` - Previsualiza el build de producción

## Uso

1. Agrega tus electrodomésticos con su potencia (Watts) y horas de uso diario
2. Configura el precio por kWh en tu zona
3. Visualiza el consumo y costos estimados en el dashboard

## Licencia

MIT
