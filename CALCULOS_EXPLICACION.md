# Explicación de los Cálculos de Predicción de Consumo

## 📊 Cálculos Actuales

### 1. **Cálculo de Consumo Energético** (`consumptionCalculator.ts`)

```typescript
// Fórmula actual:
dailyKwh = Σ (potenciaWatts × horasDía) / 1000
```

**Cómo funciona:**
- Para cada electrodoméstico: multiplica su potencia (Watts) por las horas de uso diario
- Divide entre 1000 para convertir de Wh a kWh
- Suma todos los electrodomésticos para obtener el consumo diario total

**Ejemplo:**
- Refrigerador: 200W × 24 horas = 4,800 Wh = 4.8 kWh/día
- Lámpara LED: 10W × 8 horas = 80 Wh = 0.08 kWh/día
- Total diario: 4.88 kWh

**Problemas actuales:**
- ❌ Asume que todos los electrodomésticos funcionan de forma constante (no considera ciclos ON/OFF)
- ❌ No diferencia entre consumo continuo vs. intermitente
- ❌ Multiplica días × 30 y × 365 sin considerar variaciones estacionales

---

### 2. **Cálculo de Generación Solar** (`solarPrediction.ts`)

```typescript
// Por hora:
generacionHora = (radiacionW/m² × 1hora × areaTotal × eficiencia) / 1000

// Diario:
generacionDiaria = Σ generacionHora (primeras 24 horas)
```

**Cómo funciona:**
- **Radiación solar**: Obtiene datos de Open-Meteo API (W/m² por hora)
- **Área total**: Cantidad de paneles × área por panel
- **Eficiencia**: Factor de conversión (15%-25% típico)
- **Conversión**: Divide entre 1000 para pasar de Wh a kWh

**Ejemplo:**
- Radiación: 500 W/m²
- 10 paneles × 1 m² = 10 m² totales
- Eficiencia: 20% (0.20)
- Generación/hora = (500 × 1 × 10 × 0.20) / 1000 = **1 kWh/hora**

**Problemas actuales:**
- ❌ Solo usa las primeras 24 horas del pronóstico (no promedia múltiples días)
- ❌ No considera pérdidas por:
  - Inclinación y orientación del panel (factor de corrección)
  - Sombreado
  - Temperatura del panel (eficiencia baja con temperatura alta)
  - Suciedad/polvo en los paneles
  - Pérdidas en el inversor (típicamente 5-10%)

---

### 3. **Cálculo de Baterías** (`solarPrediction.ts`)

```typescript
// Energía almacenable:
maxAlmacenable = min(
    generacionDiaria × eficienciaBateria,
    capacidadBaterias × eficienciaBateria
)

// Días de autonomía:
autonomia = (capacidadBaterias × eficienciaBateria) / consumoDiario
```

**Cómo funciona:**
- Limita la energía almacenable al mínimo entre:
  - Lo que se puede generar (con eficiencia)
  - La capacidad física de las baterías
- Calcula autonomía dividiendo capacidad útil entre consumo diario

**Problemas actuales:**
- ❌ No considera profundidad de descarga (DoD) recomendada (típicamente 50-80% para baterías de litio)
- ❌ No diferencia entre tipos de baterías (plomo-ácido, litio, etc.)
- ❌ Asume que las baterías siempre pueden cargarse al 100%
- ❌ No considera el tiempo de carga/descarga

---

## 🚀 Mejoras Recomendadas

### 1. **Mejoras en Cálculo de Consumo**

#### A. Factor de Carga (Duty Cycle)
```typescript
// Mejora: Considerar ciclo ON/OFF
dailyKwh = Σ (potenciaWatts × horasDía × factorCarga) / 1000

// Ejemplo:
// Refrigerador: 200W × 24h × 0.5 (50% encendido) = 2.4 kWh
// vs actual: 200W × 24h = 4.8 kWh (sobreestima)
```

#### B. Consumo Estacional
```typescript
// Mejora: Factores estacionales
monthlyKwh = dailyKwh × 30 × factorEstacional

// Factores sugeridos:
// Verano: 1.15 (más AC)
// Invierno: 1.10 (más calefacción)
// Primavera/Otoño: 0.95
```

#### C. Perfiles de Consumo Horario
```typescript
// Mejora: Distribuir consumo por horas del día
consumoPorHora = {
  madrugada: consumoTotal × 0.15,  // 00:00-06:00
  mañana: consumoTotal × 0.25,     // 06:00-12:00
  tarde: consumoTotal × 0.30,      // 12:00-18:00
  noche: consumoTotal × 0.30       // 18:00-24:00
}
```

---

### 2. **Mejoras en Generación Solar**

#### A. Factor de Inclinación y Orientación
```typescript
// Mejora: Corrección por orientación
generacionCorregida = generacionHora × factorInclinacion × factorOrientacion

// Ejemplos:
// Orientación Sur (Colombia): 1.0 (óptimo)
// Este/Oeste: 0.85-0.90
// Norte: 0.60-0.70

// Inclinación óptima (latitud - 10°):
// La Guajira (11°): 0° = 1.0, 30° = 0.95
```

#### B. Pérdidas del Sistema
```typescript
// Mejora: Aplicar pérdidas típicas
generacionNeta = generacionBruta × (1 - perdidasTotales)

// Pérdidas típicas:
// Inversor: 5-8%
// Cableado: 1-2%
// Sombreado: 0-5%
// Temperatura: 0-5% (corrección según temp del panel)
// Suciedad: 2-3%
// Total: ~10-15% de pérdidas
```

#### C. Promedio de Múltiples Días
```typescript
// Mejora: Usar promedio de 7 días en lugar de solo el primero
dailySolarGeneration = promedio(breakdown.slice(0, 24), ...slice(24, 48), ...)
```

#### D. Corrección por Temperatura
```typescript
// Mejora: La eficiencia baja con temperatura
eficienciaCorregida = eficiencia × (1 - coeficienteTemp × (tempPanel - tempSTC))

// STC = 25°C (condiciones estándar)
// Coeficiente típico: 0.004/°C para silicio
// Ejemplo: Si tempPanel = 50°C
// eficienciaCorregida = 0.20 × (1 - 0.004 × 25) = 0.18 (10% menos)
```

---

### 3. **Mejoras en Baterías**

#### A. Profundidad de Descarga (DoD)
```typescript
// Mejora: No usar 100% de la capacidad
capacidadUtil = capacidadTotal × DoD × eficienciaBateria

// DoD recomendado:
// Litio: 80-90%
// Plomo-ácido: 50%
// Gel: 60%
```

#### B. Simulación por Horas
```typescript
// Mejora: Simular día completo hora por hora
for (hora = 0; hora < 24; hora++) {
  generacion = calcularGeneracionHora(hora, radiacion)
  consumo = calcularConsumoHora(hora, perfil)
  
  // Si genera más de lo que consume
  if (generacion > consumo) {
    excedente = generacion - consumo
    // Cargar baterías (hasta capacidad máxima)
    baterias += excedente × eficienciaCarga
    baterias = min(baterias, capacidadMax)
  } else {
    deficit = consumo - generacion
    // Descargar baterías
    baterias -= deficit / eficienciaDescarga
    baterias = max(baterias, capacidadMin) // DoD
  }
}
```

#### C. Ciclos de Vida de Baterías
```typescript
// Mejora: Considerar degradación
capacidadEfectiva = capacidadNominal × (1 - degradacionPorCiclo × ciclosCompletos)

// Ejemplo:
// Batería nueva: 10 kWh
// Después de 1000 ciclos (80% DoD): 10 × (1 - 0.0001 × 1000) = 9 kWh
```

---

### 4. **Mejoras en Predicción**

#### A. Análisis de Variabilidad
```typescript
// Mejora: Mostrar rango de predicción
prediccionDiaria = {
  promedio: calculoActual,
  minimo: promedio - (desviacion × 2),
  maximo: promedio + (desviacion × 2),
  confianza: calcularNivelConfianza(historial)
}
```

#### B. Predicción Estacional
```typescript
// Mejora: Ajustar según época del año
generacionAjustada = generacionActual × factorEstacional

// Factores por mes (hemisferio norte como referencia):
// Diciembre-Enero (verano Colombia): 1.05
// Junio-Julio (invierno): 0.95
```

#### C. Optimización del Sistema
```typescript
// Mejora: Sugerir configuración óptima
sugerencia = {
  panelesOptimos: calcularPanelesParaCubrir(consumoDiario),
  bateriasOptimas: calcularBateriasParaAutonomia(diasDeseados),
  orientacionOptima: calcularOrientacion(latitud),
  inclinacionOptima: calcularInclinacion(latitud)
}
```

---

## 📈 Prioridades de Implementación

### Alta Prioridad (Impacto Alto, Esfuerzo Medio)
1. ✅ **Factor de pérdidas del sistema** (10-15%) - Fácil de implementar
2. ✅ **Profundidad de descarga (DoD)** - Importante para precisión
3. ✅ **Factor de inclinación/orientación** - Mejora realista

### Media Prioridad (Impacto Alto, Esfuerzo Alto)
4. ⚠️ **Simulación hora por hora** - Más preciso pero complejo
5. ⚠️ **Perfiles de consumo horario** - Requiere más datos del usuario

### Baja Prioridad (Impacto Medio, Esfuerzo Variable)
6. 📝 **Factores estacionales** - Mejora marginal
7. 📝 **Análisis de variabilidad** - Interesante pero no crítico
8. 📝 **Degradación de baterías** - Para análisis a largo plazo

---

## 🎯 Recomendación Inmediata

**Implementar las 3 mejoras de Alta Prioridad** mejoraría significativamente la precisión de los cálculos sin aumentar demasiado la complejidad del código.

