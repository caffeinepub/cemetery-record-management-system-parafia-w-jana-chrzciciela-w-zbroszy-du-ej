import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, Check, X } from 'lucide-react';
import { fileToDataUrl, resizeImage } from './imageEditing';
import { ExternalBlob } from '../../backend';

interface ImageUploadEditorProps {
  label: string;
  currentImage?: ExternalBlob | null | undefined;
  onSave: (blob: ExternalBlob) => Promise<void>;
  outputWidth?: number;
  outputHeight?: number;
  disabled?: boolean;
}

export default function ImageUploadEditor({
  label,
  currentImage,
  onSave,
  outputWidth = 800,
  outputHeight = 600,
  disabled = false,
}: ImageUploadEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Proszę wybrać plik graficzny');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Plik jest za duży. Maksymalny rozmiar to 5MB');
        return;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        setImageSrc(dataUrl);
      } catch (error) {
        console.error('Błąd podczas wczytywania pliku:', error);
        alert('Nie można wczytać pliku');
      }
    }
  };

  const handleSave = async () => {
    if (!imageSrc) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const resizedImageBytes = await resizeImage(
        imageSrc,
        outputWidth,
        outputHeight
      );

      // Cast to the expected type for ExternalBlob.fromBytes
      const typedArray = new Uint8Array(resizedImageBytes.buffer) as Uint8Array<ArrayBuffer>;
      
      const blob = ExternalBlob.fromBytes(typedArray).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        }
      );

      await onSave(blob);
      
      // Reset state after successful save
      setImageSrc(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      alert('Nie można zapisać obrazu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setImageSrc(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        
        {/* Current image preview */}
        {!imageSrc && currentImage && (
          <div className="relative h-48 rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={currentImage.getDirectURL()}
              alt="Obecny obraz"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* File upload button */}
        {!imageSrc && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={disabled || isSaving}
              className="hidden"
              id={`file-upload-${label.replace(/\s+/g, '-')}`}
            />
            <label htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}>
              <Button
                type="button"
                variant="outline"
                disabled={disabled || isSaving}
                className="w-full"
                asChild
              >
                <span className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Wybierz nowy obraz
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Obsługiwane formaty: JPG, PNG, GIF. Maksymalny rozmiar: 5MB
            </p>
          </div>
        )}

        {/* Preview and save interface */}
        {imageSrc && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
                <img
                  src={imageSrc}
                  alt="Podgląd"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Obraz zostanie automatycznie przeskalowany do {outputWidth}x{outputHeight}px
              </p>

              {isSaving && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Przesyłanie...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Zapisz obraz
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Anuluj
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
