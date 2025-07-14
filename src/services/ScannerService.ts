import { isValid, parse } from 'date-fns';
import { BarcodeScanningResult } from 'expo-camera';
// @ts-ignore
import TextRecognition from 'react-native-text-recognition';

// Scanner service types
export interface ProductInfo {
    productName?: string;
    category?: string;
    imageUrl?: string;
    barcode?: string;
}

export interface ScanResult {
    productInfo?: ProductInfo;
    detectedBarcode?: string;
    detectedExpiryDate?: string;
    allDetectedDates: string[];
    recognizedText?: string;
    barcodeCount: number;
    hasProductInfo: boolean;
    hasExpiryDate: boolean;
    isSuccess: boolean;
    errorMessage?: string;
}

export enum ScanMode {
    PRODUCT = 'product',
    EXPIRY_DATE = 'expiryDate'
}

class ScannerService {
    private static _instance: ScannerService;

    static get instance() {
        if (!this._instance) this._instance = new ScannerService();
        return this._instance;
    }

    private constructor() { }

    // OpenFoodFacts API integration
    async getProductInfo(barcode: string): Promise<ProductInfo | null> {
        try {
            console.log(`Fetching product info for barcode: ${barcode}`);
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await response.json();

            if (data.status === 1 && data.product) {
                const product = data.product;
                return {
                    productName: product.product_name || product.product_name_en,
                    category: this.mapCategory(product.categories),
                    imageUrl: product.image_url || product.image_front_url,
                    barcode: barcode,
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching product info:', error);
            return null;
        }
    }

    // Map OpenFoodFacts categories to our app categories
    private mapCategory(categories?: string): string {
        if (!categories) return 'Other';

        const categoryLower = categories.toLowerCase();

        if (categoryLower.includes('dairy') || categoryLower.includes('milk') || categoryLower.includes('cheese')) {
            return 'Dairy';
        }
        if (categoryLower.includes('fruit')) return 'Fruits';
        if (categoryLower.includes('vegetable')) return 'Vegetables';
        if (categoryLower.includes('meat') || categoryLower.includes('fish')) return 'Meat';
        if (categoryLower.includes('beverage') || categoryLower.includes('drink')) return 'Beverages';
        if (categoryLower.includes('bread') || categoryLower.includes('bakery')) return 'Bakery';
        if (categoryLower.includes('snack')) return 'Snacks';
        if (categoryLower.includes('frozen')) return 'Frozen';

        return 'Pantry';
    }

    // Process barcode scan result
    async processBarcodeResult(barcodeResult: BarcodeScanningResult): Promise<ScanResult> {
        try {
            const barcode = barcodeResult.data;
            console.log(`Processing barcode: ${barcode}`);

            // Get product info from OpenFoodFacts
            const productInfo = await this.getProductInfo(barcode);

            return {
                productInfo: productInfo ?? undefined,
                detectedBarcode: barcode,
                allDetectedDates: [],
                barcodeCount: 1,
                hasProductInfo: productInfo !== null,
                hasExpiryDate: false,
                isSuccess: true,
            };
        } catch (error) {
            console.error('Error processing barcode:', error);
            return this.createErrorResult(`Failed to process barcode: ${error}`);
        }
    }

    // Extract expiry dates from text (simplified version of ML Kit functionality)
    extractExpiryDates(text: string): string[] {
        const dates: string[] = [];

        // Pre-process text: remove spaces around separators to handle OCR errors
        const cleanText = text.replace(/\s*([/\-.])\s*/g, '$1');

        // Keywords and patterns to look for. Ordered by priority.
        const datePatterns = [
            // With keywords: EXP 12/25, BEST BY 2025-12-31
            /(?:EXP|BB|BEST BY|BEST BEFORE|USE BY)[:\s.]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi,
            /(?:EXP|BB|BEST BY|BEST BEFORE|USE BY)[:\s.]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/gi,
            /(?:EXP|BB|BEST BY|BEST BEFORE|USE BY)[:\s.]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{2,4})/gi,

            // Standalone dates
            /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, // MM/DD/YYYY, MM-DD-YYYY
            /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}\b/gi, // DD MMM YYYY
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{2,4}\b/gi, // MMM DD, YYYY
            /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g, // YYYY/MM/DD
        ];

        datePatterns.forEach(pattern => {
            // Reset regex state for global patterns
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(cleanText)) !== null) {
                // If the pattern has a capturing group for the date, use it. Otherwise, use the full match.
                dates.push(match[1] ? match[1].trim() : match[0].trim());
            }
        });

        return [...new Set(dates)]; // Return unique dates
    }

    // Get the best expiry date from detected dates
    getBestExpiryDate(dates: string[]): string | null {
        if (dates.length === 0) return null;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let bestDate: Date | null = null;

        for (const dateStr of dates) {
            const parsedDate = this.tryParseDate(dateStr);
            if (parsedDate && parsedDate >= startOfToday) {
                // If it's a valid future date
                if (!bestDate || parsedDate < bestDate) {
                    // Choose the soonest valid future date
                    bestDate = parsedDate;
                }
            }
        }

        return bestDate ? bestDate.toISOString() : null;
    }

    // Helper to try multiple parsing formats
    private tryParseDate(dateString: string): Date | null {
        const now = new Date();
        const formats = [
            'MM/dd/yy', 'M/d/yy', 'MM/dd/yyyy', 'M/d/yyyy',
            'dd-MM-yy', 'd-M-yy', 'dd-MM-yyyy', 'd-M-yyyy',
            'dd.MM.yy', 'd.M.yy', 'dd.MM.yyyy', 'd.M.yyyy',
            'yyyy-MM-dd',
            'dd MMM yyyy', 'd MMM yyyy',
            'MMM dd yyyy', 'MMM d yyyy',
        ];

        for (const format of formats) {
            try {
                const parsed = parse(dateString, format, new Date());
                if (isValid(parsed)) {
                    // Handle 2-digit year ambiguity (e.g., '25' -> 2025)
                    if (dateString.match(/\b\d{2}$/)) {
                        if (parsed.getFullYear() > now.getFullYear() + 20) {
                            parsed.setFullYear(parsed.getFullYear() - 100);
                        }
                    }
                    // Adjust for timezone offset to prevent the date from shifting
                    const timezoneOffset = parsed.getTimezoneOffset() * 60000;
                    return new Date(parsed.getTime() - timezoneOffset);
                }
            } catch (e) { /* ignore */ }
        }
        return null;
    }

    // Recognize text from an image using Expo 9s TextRecognition module
    async recognizeTextFromImage(imageUri: string): Promise<string> {
        try {
            // The recognizer returns an array of blocks or strings depending on SDK version.
            // We normalise it to a single string.
            // @ts-ignore – signature differs slightly between SDK versions
            const result = await TextRecognition.recognize(imageUri);
            if (Array.isArray(result)) {
                return result.join(' ');
            }
            return '';
        } catch (error) {
            console.error('Text recognition error', error);
            return '';
        }
    }

    // Combined scan that attempts barcode lookup and expiry date OCR on a captured image
    async scanImage(imageUri: string): Promise<ScanResult> {
        try {
            const recognizedText = await this.recognizeTextFromImage(imageUri);
            console.log("Recognized Text from Scanner:", recognizedText);
            const dates = this.extractExpiryDates(recognizedText);
            const bestDate = this.getBestExpiryDate(dates);

            return {
                detectedExpiryDate: bestDate || undefined, // Only include if detected
                allDetectedDates: dates,
                recognizedText,
                barcodeCount: 0,
                hasProductInfo: false,
                hasExpiryDate: !!bestDate,
                isSuccess: true,
            };
        } catch (error) {
            return this.createErrorResult(`Text recognition error: ${error}`);
        }
    }

    // Create error result
    private createErrorResult(errorMessage: string): ScanResult {
        return {
            allDetectedDates: [],
            barcodeCount: 0,
            hasProductInfo: false,
            hasExpiryDate: false,
            isSuccess: false,
            errorMessage,
        };
    }

    // Complete scan processing (combining barcode and text if available)
    async processScanResult(
        barcodeResult?: BarcodeScanningResult,
        recognizedText?: string
    ): Promise<ScanResult> {
        try {
            let productInfo: ProductInfo | undefined;
            let detectedBarcode: string | undefined;
            let barcodeCount = 0;

            // Process barcode if available
            if (barcodeResult) {
                detectedBarcode = barcodeResult.data;
                barcodeCount = 1;
                const fetched = await this.getProductInfo(detectedBarcode);
                productInfo = fetched ?? undefined;
            }

            // Extract expiry dates from text if available
            let detectedExpiryDate: string | undefined;
            let allDetectedDates: string[] = [];

            if (recognizedText) {
                allDetectedDates = this.extractExpiryDates(recognizedText);
                detectedExpiryDate = this.getBestExpiryDate(allDetectedDates) ?? undefined;
            }

            return {
                productInfo,
                detectedBarcode,
                detectedExpiryDate,
                allDetectedDates,
                recognizedText,
                barcodeCount,
                hasProductInfo: productInfo !== undefined,
                hasExpiryDate: detectedExpiryDate !== undefined,
                isSuccess: true,
            };
        } catch (error) {
            console.error('Error processing scan result:', error);
            return this.createErrorResult(`Failed to process scan: ${error}`);
        }
    }
}

export const scannerService = ScannerService.instance; 