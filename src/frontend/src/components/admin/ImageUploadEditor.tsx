import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, X } from 'lucide-react';
import { ExternalBlob } from '../../backend';
import { resizeImage, fileToDataUrl } from './imageEditing';
import { Progress } from '@/components/ui/progress';

interface ImageUploadEditorProps {
  label: string;
  currentImage?: ExternalBlob | null;
  onSave: (blob: ExternalBlob | null) => Promise<void>;
  outputWidth?: number;
  outputHeight?: number;
  aspectRatio?: string;
  disabled?: boolean;
}

export default function ImageUploadEditor({
  label,
  currentImage,
  onSave,
  outputWidth = 1200,
  outputHeight = 800,
  aspectRatio,
  disabled = false,
}: ImageUploadEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      // Convert file to data URL first
      const dataUrl = await fileToDataUrl(selectedFile);
      
      // Resize image to fit within max dimensions
      const resizedBytes = await resizeImage(dataUrl, outputWidth, outputHeight);

      // Create ExternalBlob with upload progress tracking
      // Cast to Uint8Array<ArrayBuffer> to satisfy type requirements
      const blob = ExternalBlob.fromBytes(resizedBytes as Uint8Array<ArrayBuffer>).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await onSave(blob);

      // Clear selection after successful save
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to save image:', error);
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await onSave(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to remove image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentImageUrl = currentImage?.getDirectURL();
  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {displayUrl && (
        <Card>
          <CardContent className="p-4">
            <div className={`relative ${aspectRatio ? `aspect-${aspectRatio}` : 'max-h-64'} overflow-hidden rounded-md`}>
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isSaving || disabled}
          className="flex-1"
        />

        {selectedFile && (
          <>
            <Button onClick={handleSave} disabled={isSaving || disabled}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Zapisz
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving || disabled}>
              Anuluj
            </Button>
          </>
        )}

        {!selectedFile && currentImageUrl && (
          <Button variant="destructive" onClick={handleRemove} disabled={isSaving || disabled}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {isSaving && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Przesyłanie: {uploadProgress}%
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Maksymalne wymiary: {outputWidth}x{outputHeight}px. Obraz zostanie automatycznie przeskalowany.
      </p>
    </div>
  );
}
