import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SCAN_MODEL = 'gemini-2.5-flash';
const PREPROCESS_MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.9;

export interface BoundingBox {
  field: string;
  value: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2], normalized 0..1000
}

export interface BillExtractionJson {
  rr_number: string;
  consumer_name: string;
  bill_date: string;
  net_payable: string;
  due_date: string;
  consumed_units_kwh: string;
  present_reading: string;
  previous_reading: string;
  subsidy_status: string;
  subsidy_amount: string;
}

export interface ElectricityBillExtraction {
  json: BillExtractionJson;
  consumedUnitsKwh: number;
  boxes: BoundingBox[];
  rawResponseText: string;
}

export interface PreprocessedBillImage {
  mimeType: string;
  base64Data: string;
  previewDataUrl: string;
  width: number;
  height: number;
}

interface RawBillExtractionResponse extends BillExtractionJson {
  bounding_boxes?: Array<{
    field?: unknown;
    value?: unknown;
    confidence?: unknown;
    box?: unknown;
  }>;
}

const BILL_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  required: [
    'rr_number',
    'consumer_name',
    'bill_date',
    'net_payable',
    'due_date',
    'consumed_units_kwh',
    'present_reading',
    'previous_reading',
    'subsidy_status',
    'subsidy_amount',
    'bounding_boxes',
  ],
  properties: {
    rr_number: { type: SchemaType.STRING },
    consumer_name: { type: SchemaType.STRING },
    bill_date: { type: SchemaType.STRING },
    net_payable: { type: SchemaType.STRING },
    due_date: { type: SchemaType.STRING },
    consumed_units_kwh: { type: SchemaType.STRING },
    present_reading: { type: SchemaType.STRING },
    previous_reading: { type: SchemaType.STRING },
    subsidy_status: { type: SchemaType.STRING },
    subsidy_amount: { type: SchemaType.STRING },
    bounding_boxes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ['field', 'value', 'confidence', 'box'],
        properties: {
          field: { type: SchemaType.STRING },
          value: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          box: {
            type: SchemaType.ARRAY,
            minItems: 4,
            maxItems: 4,
            items: { type: SchemaType.NUMBER },
          },
        },
      },
    },
  },
} as const;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

const parseNumericValue = (input: string): number => {
  const cleaned = input.replace(/,/g, '').replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const readFileAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file data.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to decode the uploaded image.'));
    image.src = source;
  });

const enhanceContrast = (ctx: CanvasRenderingContext2D, width: number, height: number, factor = 1.15) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = ((data[i] / 255 - 0.5) * factor + 0.5) * 255;
    const g = ((data[i + 1] / 255 - 0.5) * factor + 0.5) * 255;
    const b = ((data[i + 2] / 255 - 0.5) * factor + 0.5) * 255;
    data[i] = clamp(Math.round(r), 0, 255);
    data[i + 1] = clamp(Math.round(g), 0, 255);
    data[i + 2] = clamp(Math.round(b), 0, 255);
  }

  ctx.putImageData(imageData, 0, 0);
};

const findContentBounds = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 16) continue;

      const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (luminance < 245) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  const margin = 14;
  const x = clamp(minX - margin, 0, width - 1);
  const y = clamp(minY - margin, 0, height - 1);
  const w = clamp(maxX - minX + margin * 2, 1, width - x);
  const h = clamp(maxY - minY + margin * 2, 1, height - y);

  // If crop is too tiny, keep the full image.
  if (w * h < width * height * 0.35) {
    return null;
  }

  return { x, y, w, h };
};

const maybeExtractJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = raw.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw new Error('Model output was not valid JSON.');
  }
};

const normalizeBoxes = (value: unknown): BoundingBox[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: BoundingBox[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as { field?: unknown; value?: unknown; confidence?: unknown; box?: unknown };
    if (!Array.isArray(entry.box) || entry.box.length !== 4) continue;

    const normalized = entry.box.map((num) =>
      clamp(Number.isFinite(Number(num)) ? Number(num) : 0, 0, 1000)
    ) as [number, number, number, number];

    const x1 = Math.min(normalized[0], normalized[2]);
    const y1 = Math.min(normalized[1], normalized[3]);
    const x2 = Math.max(normalized[0], normalized[2]);
    const y2 = Math.max(normalized[1], normalized[3]);

    rows.push({
      field: toStringValue(entry.field),
      value: toStringValue(entry.value),
      confidence: clamp(Number(entry.confidence) || 0, 0, 1),
      box: [x1, y1, x2, y2],
    });
  }

  return rows;
};

const normalizeExtraction = (raw: unknown): ElectricityBillExtraction => {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as RawBillExtractionResponse;

  const json: BillExtractionJson = {
    rr_number: toStringValue(obj.rr_number),
    consumer_name: toStringValue(obj.consumer_name),
    bill_date: toStringValue(obj.bill_date),
    net_payable: toStringValue(obj.net_payable),
    due_date: toStringValue(obj.due_date),
    consumed_units_kwh: toStringValue(obj.consumed_units_kwh),
    present_reading: toStringValue(obj.present_reading),
    previous_reading: toStringValue(obj.previous_reading),
    subsidy_status: toStringValue(obj.subsidy_status),
    subsidy_amount: toStringValue(obj.subsidy_amount),
  };

  let consumedUnitsKwh = parseNumericValue(json.consumed_units_kwh);
  if (consumedUnitsKwh <= 0) {
    const present = parseNumericValue(json.present_reading);
    const previous = parseNumericValue(json.previous_reading);
    if (present > previous) {
      consumedUnitsKwh = present - previous;
    }
  }

  return {
    json,
    consumedUnitsKwh,
    boxes: normalizeBoxes(obj.bounding_boxes),
    rawResponseText: JSON.stringify(obj, null, 2),
  };
};

const buildPrompt = () => `
Extract the RR Number, Consumer Name, Bill Date, Net Amount Payable, and Due Date from this Karnataka Electricity Bill.
Also extract consumed units in kWh, present meter reading, previous meter reading, and subsidy details when visible.

Return strict JSON matching this structure:
{
  "rr_number": "", "consumer_name": "", "bill_date": "", "net_payable": "", "due_date": "",
  "consumed_units_kwh": "", "present_reading": "", "previous_reading": "", "subsidy_status": "", "subsidy_amount": "",
  "bounding_boxes": [ { "field": "", "value": "", "confidence": 0.9, "box": [0,0,1000,1000] } ]
}

For bounding boxes, return one entry per detected field in "bounding_boxes":
- field: extracted field key
- value: extracted text
- confidence: number between 0 and 1
- box: [x1, y1, x2, y2] normalized to 0..1000, where x grows left->right and y grows top->bottom

If a field is missing, return an empty string for that field.
No markdown.
`.trim();

const generateWithStructuredSchema = async (imagePart: any): Promise<ElectricityBillExtraction> => {
  if (!genAI) throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');

  const model = genAI.getGenerativeModel({
    model: SCAN_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: BILL_RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  const response = await model.generateContent([{ text: buildPrompt() }, imagePart]);
  const text = response.response.text();
  const parsed = maybeExtractJson(text);
  const normalized = normalizeExtraction(parsed);
  return { ...normalized, rawResponseText: text };
};

const generateWithFallbackPrompt = async (imagePart: any): Promise<ElectricityBillExtraction> => {
  if (!genAI) throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');

  const model = genAI.getGenerativeModel({
    model: SCAN_MODEL,
    generationConfig: {
      temperature: 0.1,
    },
  });

  const fallbackPrompt = `${buildPrompt()}\n\nReply with one JSON object only and no extra text.`;
  const response = await model.generateContent([{ text: fallbackPrompt }, imagePart]);
  const text = response.response.text();
  const parsed = maybeExtractJson(text);
  const normalized = normalizeExtraction(parsed);
  return { ...normalized, rawResponseText: text };
};

export const canScanElectricityBills = (): boolean => !!genAI;

export const preprocessBillImage = async (file: File): Promise<PreprocessedBillImage> => {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(rawDataUrl);

  const scale = Math.min(1, PREPROCESS_MAX_DIMENSION / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = targetWidth;
  baseCanvas.height = targetHeight;
  const baseCtx = baseCanvas.getContext('2d');

  if (!baseCtx) {
    throw new Error('Could not initialize image preprocessor.');
  }

  baseCtx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const contentBounds = findContentBounds(baseCtx, targetWidth, targetHeight);
  const finalCanvas = document.createElement('canvas');

  if (contentBounds) {
    finalCanvas.width = contentBounds.w;
    finalCanvas.height = contentBounds.h;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) {
      throw new Error('Could not initialize image cropper.');
    }
    finalCtx.drawImage(
      baseCanvas,
      contentBounds.x,
      contentBounds.y,
      contentBounds.w,
      contentBounds.h,
      0,
      0,
      contentBounds.w,
      contentBounds.h,
    );
    enhanceContrast(finalCtx, contentBounds.w, contentBounds.h);
  } else {
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) {
      throw new Error('Could not initialize image enhancer.');
    }
    finalCtx.drawImage(baseCanvas, 0, 0);
    enhanceContrast(finalCtx, targetWidth, targetHeight);
  }

  const previewDataUrl = finalCanvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64Data = previewDataUrl.split(',')[1] ?? '';

  return {
    mimeType: 'image/jpeg',
    base64Data,
    previewDataUrl,
    width: finalCanvas.width,
    height: finalCanvas.height,
  };
};

export const scanElectricityBill = async (file: File): Promise<{
  preprocessedImage: PreprocessedBillImage;
  extraction: ElectricityBillExtraction;
  usedFallback: boolean;
}> => {
  const preprocessedImage = await preprocessBillImage(file);
  const imagePart = {
    inlineData: {
      mimeType: preprocessedImage.mimeType,
      data: preprocessedImage.base64Data,
    },
  };

  try {
    const extraction = await generateWithStructuredSchema(imagePart);
    return { preprocessedImage, extraction, usedFallback: false };
  } catch {
    const extraction = await generateWithFallbackPrompt(imagePart);
    return { preprocessedImage, extraction, usedFallback: true };
  }
};

export const toAnnualizedKwh = (consumedUnitsKwh: number, billingMonths: number): number => {
  const months = clamp(Math.round(billingMonths || 1), 1, 12);
  if (consumedUnitsKwh <= 0) return 0;
  return Math.round((consumedUnitsKwh / months) * 12);
};
