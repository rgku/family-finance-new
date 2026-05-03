"use client";

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { parseReceiptText, suggestCategory, type OCRResult } from "@/lib/ocr";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";

interface OCRScannerProps {
  onDataExtracted: (data: OCRResult & { suggestedCategory: string }) => void;
  onCancel: () => void;
}

export function OCRScanner({ onDataExtracted, onCancel }: OCRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast("Por favor, seleciona uma imagem válida", "error");
      return;
    }

    if (!supportedTypes.includes(file.type)) {
      showToast("Formato não suportado. Usa JPG, PNG ou WebP.", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Imagem muito grande. Máximo 10MB.", "error");
      return;
    }

    setScanning(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const worker = await createWorker(['por', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 60000);
      });

      const recognizePromise = worker.recognize(file);
      const { data } = await Promise.race([recognizePromise, timeoutPromise]);
      
      await worker.terminate();

      const ocrResult = parseReceiptText(data.text);
      const suggestedCategory = suggestCategory(ocrResult.merchant, data.text);

      setScanning(false);
      
      if (ocrResult.total > 0) {
        showToast("Recibo processado com sucesso!", "success");
        onDataExtracted({
          ...ocrResult,
          suggestedCategory,
        });
      } else {
        showToast("Não foi possível extrair o valor. Preenche manualmente.", "info");
        onDataExtracted({
          ...ocrResult,
          suggestedCategory,
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      setScanning(false);
      
      // Garante cleanup do worker
      try {
        const worker = await createWorker(['por', 'eng']);
        await worker.terminate();
      } catch {
        // Ignore cleanup errors
      }
      
      if ((error as Error).name === 'AbortError' || (error as Error).message === 'Timeout') {
        showToast("Processamento demorado. Tenta uma imagem mais pequena.", "error");
      } else {
        showToast("Erro ao processar recibo. Tenta novamente.", "error");
      }
    }
  }

  function handleCameraCapture() {
    fileInputRef.current?.click();
  }

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 border border-surface-container-high">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
          <Icon name="camera_alt" size={20} className="text-primary" />
          Scan de Recibo
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Fechar scanner"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {!preview && !scanning && (
          <>
            <p className="text-sm text-on-surface-variant">
              Tira uma foto ao recibo ou faz upload de uma imagem. A IA vai extrair automaticamente o merchant, valor e data.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id="receipt-upload"
            />
            
            <button
              type="button"
              onClick={handleCameraCapture}
              className="w-full py-4 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              aria-label="Tirar foto ou fazer upload de recibo"
            >
              <Icon name="photo_camera" size={24} />
              Tirar Foto / Upload
            </button>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-high rounded-lg p-3">
              <Icon name="info" size={16} />
              <span>Processamento local - a imagem não sai do teu dispositivo</span>
            </div>
          </>
        )}

        {scanning && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
              ></div>
            </div>
            <p className="font-bold text-on-surface mb-2">A processar recibo...</p>
            <p className="text-sm text-on-surface-variant mb-4">
              A extrair informações do recibo
            </p>
            {progress > 0 && (
              <div 
                className="w-full max-w-xs mx-auto bg-surface-container-highest rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do OCR"
              >
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
            {progress > 0 && (
              <p className="text-xs text-on-surface-variant mt-2">{progress}%</p>
            )}
          </div>
        )}

        {preview && !scanning && (
          <div className="text-center">
            <img
              src={preview}
              alt="Preview do recibo processado"
              className="max-h-48 mx-auto rounded-lg shadow-lg mb-4"
            />
            <p className="text-sm text-on-surface-variant">
              Recibo processado! Os dados foram preenchidos no formulário.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
