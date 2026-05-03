"use client";

import { useState, useRef, useEffect } from "react";
import { createWorker } from "tesseract.js";
import { parseReceiptText, suggestCategory, type OCRResult } from "@/lib/ocr";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";

const OCR_CONFIG = {
  MAX_PDF_SIZE: 15 * 1024 * 1024,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  IMAGE_TIMEOUT: 60000,
  PDF_TIMEOUT: 90000,
} as const;

interface OCRScannerProps {
  onDataExtracted: (data: OCRResult & { suggestedCategory: string }) => void;
  onCancel: () => void;
}

interface ProcessedImage {
  canvas: HTMLCanvasElement;
  pageNumber: number;
}

export function OCRScanner({ onDataExtracted, onCancel }: OCRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const supportedPdfTypes = ['application/pdf'];

  async function convertPdfToImages(file: File): Promise<ProcessedImage[]> {
    const pdfjsLib = await import("pdfjs-dist");
    // Usar worker local do package para garantir compatibilidade de versões
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).href;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const images: ProcessedImage[] = [];

    if (pdf.numPages === 0) {
      return images;
    }

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context!,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;

    images.push({ canvas, pageNumber: 1 });
    return images;
  }

  async function handleFileUpload(file: File) {
    const isPdf = file.type === 'application/pdf';
    const isImage = supportedTypes.includes(file.type);

    if (!isPdf && !isImage) {
      showToast("Formato não suportado. Usa JPG, PNG, WebP ou PDF.", "error");
      return;
    }

    if (isPdf && file.size > OCR_CONFIG.MAX_PDF_SIZE) {
      showToast("PDF muito grande. Máximo 15MB.", "error");
      return;
    }

    if (isImage && file.size > OCR_CONFIG.MAX_IMAGE_SIZE) {
      showToast("Imagem muito grande. Máximo 10MB.", "error");
      return;
    }

    setScanning(true);
    setProgress(0);
    setFileType(isPdf ? 'pdf' : 'image');

    let imagesToProcess: ProcessedImage[] = [];

    if (isPdf) {
      try {
        imagesToProcess = await convertPdfToImages(file);
        if (imagesToProcess.length === 0) {
          showToast("PDF vazio ou inválido.", "error");
          setScanning(false);
          return;
        }
        const canvas = imagesToProcess[0].canvas;
        setPreview(canvas.toDataURL('image/jpeg'));
      } catch (error) {
        console.error("PDF conversion error:", error);
        setScanning(false);
        showToast("Erro ao processar PDF. Tenta outro ficheiro.", "error");
        return;
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Para imagens, guardar apenas referência do ficheiro
      imagesToProcess = [{
        canvas: await createImageBitmap(file).then(bitmap => {
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0);
          return canvas;
        }),
        pageNumber: 1,
      }];
    }

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
      worker = await createWorker(['por', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), isPdf ? OCR_CONFIG.PDF_TIMEOUT : OCR_CONFIG.IMAGE_TIMEOUT);
      });

      // Processar todas as imagens (páginas do PDF)
      let allText = '';
      for (const img of imagesToProcess) {
        const recognizePromise = worker.recognize(img.canvas);
        const { data } = await Promise.race([recognizePromise, timeoutPromise]);
        allText += data.text + '\n';
      }
      
      await worker.terminate();
      worker = null;

      // Cleanup dos canvases
      for (const img of imagesToProcess) {
        img.canvas.width = 0;
        img.canvas.height = 0;
      }
      imagesToProcess = [];

      const ocrResult = parseReceiptText(allText);
      const suggestedCategory = suggestCategory(ocrResult.merchant, allText);

      setScanning(false);
      
      if (ocrResult.total > 0) {
        showToast(isPdf ? "PDF processado com sucesso!" : "Recibo processado com sucesso!", "success");
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
      
      // Garantir cleanup do worker
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore cleanup errors
        }
      }
      
      // Cleanup dos canvases
      for (const img of imagesToProcess) {
        img.canvas.width = 0;
        img.canvas.height = 0;
      }
      imagesToProcess = [];
      
      if ((error as Error).name === 'AbortError' || (error as Error).message === 'Timeout') {
        showToast("Processamento demorado. Tenta um ficheiro mais pequeno.", "error");
      } else {
        showToast(isPdf ? "Erro ao processar PDF. Tenta novamente." : "Erro ao processar recibo. Tenta novamente.", "error");
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
              Tira uma foto ao recibo ou faz upload de uma imagem ou PDF. A IA vai extrair automaticamente o merchant, valor e data.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
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
              aria-label="Tirar foto ou fazer upload de recibo ou PDF"
            >
              <Icon name="photo_camera" size={24} />
              Tirar Foto / Upload
            </button>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-high rounded-lg p-3">
              <Icon name="info" size={16} />
              <span>Processamento local - suporta JPG, PNG, WebP e PDF (1ª página)</span>
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
              alt={fileType === 'pdf' ? "Preview da primeira página do PDF" : "Preview do recibo processado"}
              className="max-h-48 mx-auto rounded-lg shadow-lg mb-4"
            />
            <p className="text-sm text-on-surface-variant">
              {fileType === 'pdf' ? "PDF processado! " : "Recibo processado! "}
              Os dados foram preenchidos no formulário.
            </p>
            {fileType === 'pdf' && (
              <p className="text-xs text-on-surface-variant mt-2">
                Apenas a primeira página foi processada
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
