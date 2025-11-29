/**
 * Servicio para consumir la API de Google Gemini
 * Analiza imágenes de etiquetas energéticas de electrodomésticos
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface ExtractedApplianceData {
  name: string;
  category: string;
  power_watts: number;
  monthly_consumption_kwh: number | null;
  energy_efficiency: number | null;
  appliance_type: string | null;
  cooling_capacity_w: number | null;
  cooling_capacity_btu: number | null;
  operating_temp_min: number | null;
  operating_temp_max: number | null;
  filters_count: number | null;
  energy_rating: string | null;
  brand: string | null;
  model: string | null;
}

/**
 * Convierte una imagen a base64
 */
function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remover el prefijo data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene el tipo MIME de la imagen
 */
function getMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeTypes[extension || ''] || 'image/jpeg';
}

/**
 * Valida si la imagen es una etiqueta energética
 * Retorna un objeto con isValid: boolean y description: string
 */
async function validateEnergyLabel(
  base64Image: string,
  mimeType: string
): Promise<{ isValid: boolean; description: string; imageType?: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada. Por favor, configura la variable de entorno.');
  }

  const validationPrompt = `Analiza esta imagen y determina si es una etiqueta energética de un electrodoméstico.

Las etiquetas energéticas típicamente contienen:
- Información de consumo de energía (kWh/mes, kWh/año, Watts)
- Clasificación energética (letras A, B, C, D, E, etc.)
- Eficiencia energética (W/W, COP, SEER, EER)
- Especificaciones técnicas del electrodoméstico
- Marcas y modelos
- Tablas o gráficos con información energética

Responde SOLO con un JSON válido en este formato exacto:
{
  "isEnergyLabel": true o false,
  "description": "Descripción breve de qué es la imagen si NO es una etiqueta energética (ej: 'Es una selfie', 'Es un paisaje', 'Es un documento', etc.). Si ES una etiqueta energética, escribe 'Es una etiqueta energética'",
  "imageType": "Tipo de imagen identificado (ej: 'selfie', 'paisaje', 'documento', 'etiqueta energética', 'otro')"
}

Responde SOLO con el JSON, sin texto adicional.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: validationPrompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Error de API: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Limpiar el texto (remover markdown code blocks si existen)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const validationResult = JSON.parse(jsonText);

    return {
      isValid: validationResult.isEnergyLabel === true,
      description: validationResult.description || 'No se pudo identificar el tipo de imagen',
      imageType: validationResult.imageType || 'desconocido',
    };
  } catch (error) {
    console.error('Error al validar imagen:', error);
    // Si falla la validación, permitir continuar pero con advertencia
    return {
      isValid: true, // Permitir continuar si falla la validación
      description: 'No se pudo validar el tipo de imagen',
      imageType: 'desconocido',
    };
  }
}

/**
 * Analiza una imagen de etiqueta energética usando Gemini
 */
export async function analyzeEnergyLabel(imageFile: File): Promise<ExtractedApplianceData> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY no está configurada. Por favor, configura la variable de entorno.');
    }

    // Convertir imagen a base64
    const base64Image = await imageToBase64(imageFile);
    const mimeType = getMimeType(imageFile);

    // Primero validar si es una etiqueta energética
    const validation = await validateEnergyLabel(base64Image, mimeType);
    
    if (!validation.isValid) {
      // Crear un mensaje descriptivo basado en el tipo de imagen
      let errorMessage = 'La imagen subida no es una etiqueta energética. ';
      
      if (validation.imageType) {
        const imageTypeMessages: Record<string, string> = {
          'selfie': 'La imagen es una selfie. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
          'paisaje': 'La imagen es un paisaje. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
          'documento': 'La imagen parece ser un documento. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
          'persona': 'La imagen contiene una persona. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
          'animal': 'La imagen contiene un animal. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
          'comida': 'La imagen es de comida. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
          'otro': 'La imagen no parece ser una etiqueta energética. Por favor, sube una foto de la etiqueta energética del electrodoméstico.',
        };
        
        errorMessage += imageTypeMessages[validation.imageType.toLowerCase()] || 
          `La imagen es: ${validation.description}. Por favor, sube una foto de la etiqueta energética del electrodoméstico.`;
      } else {
        errorMessage += validation.description || 'Por favor, sube una foto de la etiqueta energética del electrodoméstico.';
      }
      
      throw new Error(errorMessage);
    }

    // Prompt para Gemini
    const prompt = `Analiza esta imagen de una etiqueta energética de un electrodoméstico y extrae TODA la información disponible. 

La etiqueta puede contener información como:
- Consumo de energía (kWh/mes, kWh/año, o Watts)
- Eficiencia energética (W/W, COP, SEER, EER, etc.)
- Tipo de electrodoméstico (Mini Split, Refrigerador, Lavadora, etc.)
- Capacidad (Watts, BTU/h, litros, kg, etc.)
- Temperatura ambiente de operación (rango en °C)
- Cantidad de filtros
- Clasificación energética (Letra A, B, C, D, E, etc.)
- Marca
- Modelo

IMPORTANTE: Responde SOLO con un JSON válido en este formato exacto (usa null para campos no encontrados):
{
  "name": "Nombre del electrodoméstico basado en tipo y marca",
  "category": "Una de estas categorías: Refrigeración, Climatización, Cocina, Lavado, Entretenimiento, Iluminación, Otro",
  "power_watts": número en watts (calcula desde consumo mensual si es necesario: consumo_mensual_kwh * 1000 / (30 * horas_promedio_diarias) o usa el valor directo si está en watts),
  "monthly_consumption_kwh": número o null,
  "energy_efficiency": número o null (extrae el valor numérico, ej: 2.78),
  "appliance_type": "Tipo específico como aparece en la etiqueta",
  "cooling_capacity_w": número en watts o null,
  "cooling_capacity_btu": número en BTU/h o null,
  "operating_temp_min": número en °C o null,
  "operating_temp_max": número en °C o null,
  "filters_count": número o null,
  "energy_rating": "Letra de clasificación (A, B, C, D, E) o null",
  "brand": "Marca del electrodoméstico",
  "model": "Modelo específico"
}

Si el consumo está en kWh/mes, úsalo directamente. Si está en kWh/año, divídelo entre 12. Si solo hay potencia en watts, calcula el consumo mensual estimado asumiendo uso promedio (ej: 8 horas/día para aires, 24h para refrigeradores).

Responde SOLO con el JSON, sin texto adicional.`;

    // Llamar a la API de Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Error de API: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Extraer el texto de la respuesta
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Limpiar el texto (remover markdown code blocks si existen)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parsear JSON
    const extractedData: ExtractedApplianceData = JSON.parse(jsonText);

    // Validar y normalizar datos
    if (!extractedData.name) {
      extractedData.name = extractedData.appliance_type || 'Electrodoméstico';
    }

    if (!extractedData.category) {
      extractedData.category = 'Otro';
    }

    // Si no hay power_watts pero hay monthly_consumption_kwh, estimar
    if (!extractedData.power_watts && extractedData.monthly_consumption_kwh) {
      // Asumir uso promedio según categoría
      const avgHoursPerDay =
        extractedData.category === 'Refrigeración' ? 24 :
        extractedData.category === 'Climatización' ? 8 :
        extractedData.category === 'Cocina' ? 2 :
        extractedData.category === 'Lavado' ? 1 :
        4; // Default
      
      extractedData.power_watts = Math.round(
        (extractedData.monthly_consumption_kwh * 1000) / (30 * avgHoursPerDay)
      );
    }

    // Si hay monthly_consumption_kwh pero no power_watts, asegurar que power_watts tenga un valor mínimo
    if (!extractedData.power_watts || extractedData.power_watts <= 0) {
      // Valor por defecto basado en categoría
      const defaultPower: Record<string, number> = {
        'Refrigeración': 150,
        'Climatización': 2000,
        'Cocina': 2000,
        'Lavado': 2000,
        'Entretenimiento': 100,
        'Iluminación': 20,
      };
      extractedData.power_watts = defaultPower[extractedData.category] || 100;
    }

    return extractedData;
  } catch (error) {
    console.error('Error al analizar etiqueta energética:', error);
    throw new Error(
      error instanceof Error
        ? `Error al analizar imagen: ${error.message}`
        : 'Error desconocido al analizar la imagen'
    );
  }
}

