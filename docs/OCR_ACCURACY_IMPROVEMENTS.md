# Melhorar Accuracy do OCR

## Problemas Atuais

O Tesseract.js client-side tem limitações:
- **Accuracy**: 70-85% em condições ideais
- **Problemas comuns**:
  - Confunde 8 com B, 0 com O, 1 com I
  - Dificuldade com fontes pequenas ou borradas
  - Erros com papel térmico desbotado
  - Problemas com múltiplas colunas

## Soluções Implementadas

### 1. ✅ Pré-processamento de Imagem
- **Grayscale**: Converte para escala de cinza
- **Threshold**: Binarização (preto/branco)
- **Scale 3.0**: Aumenta resolução para 3x

### 2. ✅ Configurações Tesseract Otimizadas
- **OEM 3**: LSTM engine (mais accurate que legacy)
- **PSM 3**: Page segmentation automático
- **DPI 300**: Simula alta resolução

### 3. ✅ Validação Pós-OCR
- Logging de valores baixos (< 5€)
- Deteta múltiplos valores no texto

---

## Para Accuracy Máxima (99%+)

### Opção 1: Veryfi API (Recomendado ⭐)

**Vantagens:**
- 99.7% accuracy
- Especializado em recibos
- Line-item extraction
- PT e 38+ línguas

**Preço:**
- 50 recibos/mês grátis
- $49/mês para 500 recibos

**Implementação:**

```typescript
// src/lib/ocr-veryfi.ts
const VERYFI_API_KEY = process.env.NEXT_PUBLIC_VERYFI_API_KEY;
const VERYFI_CLIENT_ID = process.env.NEXT_PUBLIC_VERYFI_CLIENT_ID;

export async function scanReceiptWithVeryfi(file: File) {
  const base64 = await fileToBase64(file);
  
  const response = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CLIENT-ID': VERYFI_CLIENT_ID,
      'Authorization': `apikey ${VERYFI_API_KEY}`,
    },
    body: JSON.stringify({
      file_data: base64,
      file_name: file.name,
      file_type: file.type,
    }),
  });
  
  const data = await response.json();
  
  return {
    merchant: data.vendor_name,
    total: data.total,
    date: data.date,
    lineItems: data.line_items, // ✅ Extra detalhado!
    confidence: 0.99,
  };
}
```

**Setup:**
```bash
# .env.local
NEXT_PUBLIC_VERYFI_API_KEY=teu_api_key
NEXT_PUBLIC_VERYFI_CLIENT_ID=teu_client_id
```

**Sign up:** https://hub.veryfi.com/

---

### Opção 2: Google Cloud Vision API

**Vantagens:**
- 95-98% accuracy
- Deteta texto em múltiplas orientações
- Handwriting support

**Preço:**
- 1000 requests/mês grátis
- $1.50 por 1000 requests

**Implementação:**
```typescript
// src/lib/ocr-google.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY,
});

export async function scanReceiptWithGoogle(file: File) {
  const [result] = await client.textDetection(file);
  const annotations = result.textAnnotations;
  
  return {
    text: annotations?.[0]?.description || '',
    confidence: annotations?.[0]?.score || 0,
  };
}
```

---

### Opção 3: Azure Computer Vision

**Vantagens:**
- 95-98% accuracy
- Read API (optimized para texto)

**Preço:**
- 20 calls/minuto grátis (S0 tier)
- $1 por 1000 transactions

---

## Comparação de Accuracy

| Método | Accuracy | Custo | Velocidade | Privacidade |
|--------|----------|-------|------------|-------------|
| **Tesseract.js (atual)** | 70-85% | Grátis | 2-5s | ✅ Local |
| **Tesseract + Pré-process** | 80-90% | Grátis | 3-6s | ✅ Local |
| **Veryfi API** | 99.7% | $0-49/mês | 1-2s | ⚠️ Server |
| **Google Vision** | 95-98% | $0-10/mês | 1-3s | ⚠️ Server |
| **Azure Vision** | 95-98% | Grátis (S0) | 1-3s | ⚠️ Server |

---

## Recomendação

### Para MVP / Baixo Volume:
✅ **Manter Tesseract.js com melhorias atuais**
- Custo zero
- Privacidade total
- Accuracy aceitável (80-90%)

### Para Produção / Alto Volume:
⭐ **Veryfi API (50 recibos/mês grátis)**
- Accuracy 99.7%
- Line-item extraction
- Suporte PT

### Implementação Híbrida:
```typescript
async function scanReceipt(file: File) {
  // Tentar Tesseract primeiro (grátis)
  const tesseractResult = await scanWithTesseract(file);
  
  // Se confiança baixa (< 0.7), usar Veryfi
  if (tesseractResult.confidence < 0.7) {
    return await scanWithVeryfi(file);
  }
  
  return tesseractResult;
}
```

---

## Dicas para Utilizadores

Para melhor accuracy com Tesseract:

1. **Boa iluminação** - Evitar sombras
2. **Foto nítida** - Sem blur
3. **Ângulo reto** - Não inclinar o recibo
4. **Preencher todo o frame** - Zoom no recibo
5. **Papel plano** - Evitar recibos amarrotados

---

## Próximos Passos

1. **Testar com mais recibos** - Criar dataset de teste
2. **Medir accuracy real** - Comparar extraído vs real
3. **Implementar Veryfi** - Para utilizadores premium
4. **Feedback loop** - Permitir correção manual → melhorar parsing
