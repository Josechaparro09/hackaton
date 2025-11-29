import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, Camera, X, RotateCcw } from 'lucide-react';
import { analyzeEnergyLabel, type ExtractedApplianceData } from '@/lib/gemini-service';
import { toast } from 'sonner';

interface ImageUploadAnalyzerProps {
  onDataExtracted: (data: ExtractedApplianceData) => void;
  onError?: (error: string) => void;
}

export const ImageUploadAnalyzer = ({ onDataExtracted, onError }: ImageUploadAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedApplianceData | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleReset = () => {
    setPreview(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Limpiar stream de cámara cuando se desmonte o cierre
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Inicializar cámara cuando se abre el dialog
  useEffect(() => {
    if (showCamera) {
      setIsCameraReady(false);
      
      // Intentar con cámara trasera primero, luego cualquier cámara
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let currentStream: MediaStream | null = null;

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((mediaStream) => {
          currentStream = mediaStream;
          setStream(mediaStream);
          
          if (cameraVideoRef.current) {
            const video = cameraVideoRef.current;
            video.srcObject = mediaStream;
            
            // Esperar a que el video esté listo
            const handleLoadedMetadata = () => {
              setIsCameraReady(true);
            };

            const handleError = () => {
              console.error('Error al cargar el video');
              toast.error('Error al iniciar la cámara');
              if (currentStream) {
                currentStream.getTracks().forEach((track) => track.stop());
              }
              setShowCamera(false);
            };

            video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            video.addEventListener('error', handleError, { once: true });
            
            // Forzar play
            video.play().catch((error) => {
              console.error('Error al reproducir video:', error);
              // Intentar sin restricciones si falla
              if (error.name === 'NotAllowedError' || error.name === 'NotReadableError') {
                toast.error('No se pudo acceder a la cámara', {
                  description: 'Verifica los permisos o intenta con otra cámara',
                });
                if (currentStream) {
                  currentStream.getTracks().forEach((track) => track.stop());
                }
                setShowCamera(false);
              }
            });
          }
        })
        .catch((error) => {
          console.error('Error al acceder a la cámara:', error);
          let errorMessage = 'No se pudo acceder a la cámara';
          
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.';
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'No se encontró ninguna cámara en el dispositivo.';
          } else if (error.name === 'NotReadableError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación.';
          }
          
          toast.error(errorMessage, {
            description: 'Por favor, verifica los permisos de la cámara',
          });
          setShowCamera(false);
        });

      // Cleanup function
      return () => {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
      };
    } else if (!showCamera && stream) {
      // Detener stream cuando se cierra
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [showCamera]);

  const handleOpenCamera = () => {
    // Verificar si el navegador soporta la API de MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Tu navegador no soporta el acceso a la cámara');
      return;
    }
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
    setShowCamera(false);
  };

  const handleCapturePhoto = () => {
    if (!cameraVideoRef.current || !cameraCanvasRef.current) return;

    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0);

    // Convertir canvas a blob y luego a File
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Error al capturar la foto');
        return;
      }

      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      
      // Cerrar cámara
      handleCloseCamera();

      // Procesar la imagen capturada
      processImageFile(file);
    }, 'image/jpeg', 0.9);
  };

  const processImageFile = async (file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen válido');
      onError?.('Tipo de archivo no válido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande. Máximo 10MB');
      onError?.('Imagen demasiado grande');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analizar imagen
    setIsAnalyzing(true);
    setExtractedData(null);

    try {
      const data = await analyzeEnergyLabel(file);
      setExtractedData(data);
      onDataExtracted(data);
      toast.success('Imagen analizada correctamente');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al analizar la imagen';
      
      // Determinar el tipo de error para mostrar un mensaje apropiado
      const isValidationError = errorMessage.includes('no es una etiqueta energética') || 
                                errorMessage.includes('selfie') ||
                                errorMessage.includes('paisaje') ||
                                errorMessage.includes('documento') ||
                                errorMessage.includes('persona') ||
                                errorMessage.includes('animal') ||
                                errorMessage.includes('comida');
      
      if (isValidationError) {
        toast.error('Imagen no válida', {
          description: errorMessage,
          duration: 6000, // Mostrar por más tiempo para que el usuario lo lea
        });
      } else {
        toast.error('Error al analizar la imagen', {
          description: errorMessage,
        });
      }
      
      onError?.(errorMessage);
      setPreview(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="glass-card shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Analizar Etiqueta Energética
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="image-upload" className="text-sm font-medium">
            Subir imagen de la etiqueta
          </Label>
          
          {/* Botones de acción - Responsive */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenCamera}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-initial gap-2"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Tomar Foto</span>
              <span className="sm:hidden">Cámara</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-initial gap-2"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Subir Archivo</span>
              <span className="sm:hidden">Archivo</span>
            </Button>

            {preview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isAnalyzing}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Limpiar</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            )}
          </div>

          {/* Input oculto para selección de archivo */}
          <Input
            id="image-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            disabled={isAnalyzing}
            className="hidden"
          />

          <p className="text-xs text-muted-foreground">
            Toma una foto o sube una imagen de la etiqueta energética. Formatos: JPG, PNG, WEBP
            (máx. 10MB)
          </p>
        </div>

        {/* Preview de la imagen */}
        {preview && (
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-64 sm:max-h-96 object-contain"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto" />
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">
                    Analizando imagen con IA...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado de análisis */}
        {isAnalyzing && !preview && (
          <div className="space-y-2">
            <Skeleton className="h-48 w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analizando imagen con IA...</span>
            </div>
          </div>
        )}

        {/* Datos extraídos */}
        {extractedData && !isAnalyzing && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="space-y-2">
              <p className="font-medium text-sm sm:text-base text-green-700 dark:text-green-400">
                Datos extraídos correctamente
              </p>
              <div className="text-xs sm:text-sm space-y-1.5 text-muted-foreground">
                {extractedData.name && (
                  <p className="break-words">
                    <span className="font-medium">Nombre:</span> {extractedData.name}
                  </p>
                )}
                {extractedData.brand && (
                  <p className="break-words">
                    <span className="font-medium">Marca:</span> {extractedData.brand}
                  </p>
                )}
                {extractedData.model && (
                  <p className="break-words">
                    <span className="font-medium">Modelo:</span> {extractedData.model}
                  </p>
                )}
                {extractedData.power_watts && (
                  <p>
                    <span className="font-medium">Potencia:</span> {extractedData.power_watts} W
                  </p>
                )}
                {extractedData.monthly_consumption_kwh && (
                  <p>
                    <span className="font-medium">Consumo mensual:</span>{' '}
                    {extractedData.monthly_consumption_kwh.toFixed(2)} kWh
                  </p>
                )}
                {extractedData.energy_rating && (
                  <p>
                    <span className="font-medium">Clasificación:</span> {extractedData.energy_rating}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Dialog de cámara */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && handleCloseCamera()}>
        <DialogContent className="sm:max-w-[95vw] sm:max-h-[95vh] p-0 gap-0 w-[100vw] h-[100vh] sm:w-auto sm:h-auto rounded-none sm:rounded-lg">
          <DialogHeader className="px-4 pt-4 pb-2 sm:pb-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              Tomar Foto de la Etiqueta
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Asegúrate de que la etiqueta esté bien iluminada y enfocada
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative bg-black flex items-center justify-center min-h-[50vh] sm:min-h-[400px] max-h-[60vh] sm:max-h-[70vh]">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <canvas ref={cameraCanvasRef} className="hidden" />
            
            {(!stream || !isCameraReady) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-white mx-auto" />
                  <p className="text-sm sm:text-base text-white font-medium">
                    {!stream ? 'Solicitando acceso a la cámara...' : 'Iniciando cámara...'}
                  </p>
                  <p className="text-xs text-white/70 px-4">
                    Por favor, permite el acceso a la cámara cuando se solicite
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 p-4 border-t bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCamera}
              className="flex-1 sm:flex-initial gap-2 order-2 sm:order-1"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCapturePhoto}
              disabled={!stream || !isCameraReady}
              className="flex-1 sm:flex-initial gap-2 order-1 sm:order-2"
            >
              <Camera className="h-4 w-4" />
              Capturar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

