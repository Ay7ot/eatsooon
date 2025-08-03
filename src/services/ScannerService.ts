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
        const startTime = Date.now();
        const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

        try {
            console.log(`🔍 [ScannerService] Starting API call for barcode: ${barcode}`);
            console.log(`🌐 [ScannerService] API URL: ${apiUrl}`);

            const response = await fetch(apiUrl);
            const responseTime = Date.now() - startTime;

            console.log(`⏱️ [ScannerService] API response time: ${responseTime}ms`);
            console.log(`📡 [ScannerService] Response status: ${response.status}`);
            console.log(`📡 [ScannerService] Response ok: ${response.ok}`);

            if (!response.ok) {
                console.error(`❌ [ScannerService] HTTP error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            const totalTime = Date.now() - startTime;

            console.log(`📊 [ScannerService] API response data:`, {
                status: data.status,
                statusVerbose: data.statusVerbose,
                productFound: !!data.product,
                productKeys: data.product ? Object.keys(data.product) : [],
                totalTime: `${totalTime}ms`
            });

            if (data.status === 1 && data.product) {
                const product = data.product;

                // Log detailed product information
                console.log(`📦 [ScannerService] Product details:`, {
                    barcode: barcode,
                    productName: product.product_name,
                    productNameEn: product.product_name_en,
                    genericName: product.generic_name,
                    brands: product.brands,
                    categories: product.categories,
                    imageUrl: product.image_url,
                    imageFrontUrl: product.image_front_url,
                    imageIngredientsUrl: product.image_ingredients_url,
                    imageNutritionUrl: product.image_nutrition_url,
                    imagePackagingUrl: product.image_packaging_url,
                    imageSmallUrl: product.image_small_url,
                    imageThumbUrl: product.image_thumb_url,
                    imageTinyUrl: product.image_tiny_url,
                    hasImage: !!(product.image_url || product.image_front_url),
                    hasProductName: !!(product.product_name || product.product_name_en),
                    hasCategories: !!product.categories
                });

                const productInfo = {
                    productName: product.product_name || product.product_name_en,
                    category: this.mapCategory(product.categories),
                    imageUrl: product.image_url || product.image_front_url,
                    barcode: barcode,
                };

                console.log(`✅ [ScannerService] Successfully processed product:`, {
                    finalProductName: productInfo.productName,
                    finalCategory: productInfo.category,
                    finalImageUrl: productInfo.imageUrl,
                    hasProductName: !!productInfo.productName,
                    hasCategory: !!productInfo.category,
                    hasImage: !!productInfo.imageUrl
                });

                return productInfo;
            } else {
                console.warn(`⚠️ [ScannerService] Product not found or invalid response:`, {
                    barcode: barcode,
                    status: data.status,
                    statusVerbose: data.statusVerbose,
                    hasProduct: !!data.product,
                    errorMessage: data.statusVerbose || 'Unknown error'
                });
                return null;
            }
        } catch (error) {
            const totalTime = Date.now() - startTime;
            console.error(`❌ [ScannerService] Error fetching product info:`, {
                barcode: barcode,
                error: error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                totalTime: `${totalTime}ms`,
                apiUrl: apiUrl
            });
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
        const startTime = Date.now();

        try {
            const barcode = barcodeResult.data;
            console.log(`🔍 [ScannerService] Processing barcode scan result:`, {
                barcode: barcode,
                barcodeType: barcodeResult.type,
                timestamp: new Date().toISOString()
            });

            // Get product info from OpenFoodFacts
            const productInfo = await this.getProductInfo(barcode);
            const processingTime = Date.now() - startTime;

            // Even if product isn't found, we can still provide a useful result
            // The scan was successful if we got a valid barcode, regardless of whether the product exists in the database
            const isSuccess = !!barcode && barcode.length > 0;

            const result = {
                productInfo: productInfo ?? undefined,
                detectedBarcode: barcode,
                allDetectedDates: [],
                barcodeCount: 1,
                hasProductInfo: productInfo !== null,
                hasExpiryDate: false,
                isSuccess: isSuccess,
                errorMessage: productInfo === null ? 'Product not found in database' : undefined
            };

            console.log(`📊 [ScannerService] Barcode processing result:`, {
                barcode: barcode,
                hasProductInfo: result.hasProductInfo,
                productName: result.productInfo?.productName || 'N/A',
                category: result.productInfo?.category || 'N/A',
                hasImage: !!result.productInfo?.imageUrl,
                imageUrl: result.productInfo?.imageUrl || 'N/A',
                processingTime: `${processingTime}ms`,
                success: result.isSuccess,
                errorMessage: result.errorMessage
            });

            return result;
        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`❌ [ScannerService] Error processing barcode:`, {
                barcode: barcodeResult.data,
                error: error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                processingTime: `${processingTime}ms`
            });
            return this.createErrorResult(`Failed to process barcode: ${error}`);
        }
    }

    // Extract expiry dates from text (simplified version of ML Kit functionality)
    extractExpiryDates(text: string): string[] {
        const dates: string[] = [];

        console.log(`🔍 [ScannerService] Extracting dates from text: "${text}"`);

        // Pre-process text: remove spaces around separators to handle OCR errors
        const cleanText = text.replace(/\s*([/\-.])\s*/g, '$1');

        console.log(`🔍 [ScannerService] Cleaned text: "${cleanText}"`);

        // Keywords and patterns to look for. Ordered by priority.
        const datePatterns = [
            // With keywords: EXP 12/25, BEST BY 2025-12-31, etc.
            // Added Spanish keywords like CAD, VENCE
            /(?:EXP|BB|BEST BY|BEST BEFORE|USE BY|CONSUMIR PREF|CAD|VENCE|FECHA DE VENCIMIENTO)[:\s.]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi,
            /(?:EXP|BB|BEST BY|BEST BEFORE|USE BY|CONSUMIR PREF|CAD|VENCE|FECHA DE VENCIMIENTO)[:\s.]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\s+\d{2,4})/gi,
            /(?:EXP|BB|BEST BY|BEST BEFORE|USE BY|CONSUMIR PREF|CAD|VENCE|FECHA DE VENCIMIENTO)[:\s.]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\s+\d{1,2},?\s+\d{2,4})/gi,

            // Manufacturing and expiry date keywords (MFD, BB, etc.)
            /(?:MFD|MANUFACTURING|BB|BEST BY|BEST BEFORE|EXP|EXPIRY)[:\s.]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi,
            /(?:MFD|MANUFACTURING|BB|BEST BY|BEST BEFORE|EXP|EXPIRY)[:\s.]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\s+\d{2,4})/gi,

            // Standalone dates (most specific first to avoid ambiguity)
            /\b\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\b/g, // YYYY-MM-DD
            /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}\b/g, // DD-MM-YYYY
            /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\s+\d{2,4}\b/gi, // 17 JUN 2025
            /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\s+\d{1,2},?\s+\d{2,4}\b/gi, // JUN 17, 2025
            /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2}\b/g, // DD/MM/YY

            // Month and Year only
            /\b(0[1-9]|1[0-2])[/\-.](\d{4}|\d{2})\b/g, // MM/YYYY or MM/YY

            // Dates without separators (6 or 8 digits)
            /\b(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/g, // YYYYMMDD (e.g., 20251007)
            /\b(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{4}|\d{2})\b/g,    // DDMMYYYY or DDMMYY

            // Additional formats
            // European format with dots
            /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g, // DD.MM.YYYY or DD.MM.YY

            // Military/Industrial format (YY-MM-DD)
            /\b\d{2}-\d{2}-\d{2}\b/g, // YY-MM-DD

            // Colon-separated dates (DD:MM:YY format)
            /\b\d{1,2}:\d{1,2}:\d{2}\b/g, // DD:MM:YY (e.g., 31:05:25)
            /\b\d{1,2}:\d{1,2}:\d{4}\b/g, // DD:MM:YYYY (e.g., 31:05:2025)

            // Full month names
            /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+\d{2,4}\b/gi,
            /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+\d{1,2},?\s+\d{2,4}\b/gi,

            // ISO 8601 format (with time)
            /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, // YYYY-MM-DDTHH:MM:SS

            // Roman numerals (uncommon but exists)
            /\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, // MM/DD/YYYY with Roman months

            // Reverse formats
            /\b\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}\b/g, // MM/DD/YYYY (2-digit month/day)
        ];

        datePatterns.forEach(pattern => {
            // Reset regex state for global patterns
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(cleanText)) !== null) {
                // If the pattern has a capturing group for the date, use it. Otherwise, use the full match.
                const dateFound = match[1] ? match[1].trim() : match[0].trim();
                dates.push(dateFound);
                console.log(`📅 [ScannerService] Found date: "${dateFound}" with pattern: ${pattern.source}`);
            }
        });

        const uniqueDates = [...new Set(dates)];
        console.log(`📅 [ScannerService] Extracted ${uniqueDates.length} unique dates:`, uniqueDates);
        return uniqueDates; // Return unique dates
    }

    // Get the best expiry date from detected dates
    getBestExpiryDate(dates: string[]): string | null {
        if (dates.length === 0) {
            console.log(`📅 [ScannerService] No dates to process`);
            return null;
        }

        console.log(`📅 [ScannerService] Processing ${dates.length} dates for best expiry date`);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let bestDate: Date | null = null;

        for (const dateStr of dates) {
            const parsedDate = this.tryParseDate(dateStr);
            console.log(`📅 [ScannerService] Parsing "${dateStr}" -> ${parsedDate ? parsedDate.toISOString() : 'failed'}`);

            if (parsedDate && parsedDate >= startOfToday) {
                // If it's a valid future date
                if (!bestDate || parsedDate < bestDate) {
                    // Choose the soonest valid future date
                    bestDate = parsedDate;
                    console.log(`📅 [ScannerService] New best date: ${parsedDate.toISOString()}`);
                }
            }
        }

        const result = bestDate ? bestDate.toISOString() : null;
        console.log(`📅 [ScannerService] Final best expiry date: ${result}`);
        return result;
    }

    // Helper to try multiple parsing formats
    private tryParseDate(dateString: string): Date | null {
        const now = new Date();

        // Pre-process date string to handle special cases
        const processedDateString = this.preprocessDateString(dateString);

        const formats = [
            // Prioritize day-first formats
            'dd/MM/yy', 'd/M/yy',
            'dd-MM-yy', 'd-M-yy',
            'dd.MM.yy', 'd.M.yy',
            'dd/MM/yyyy', 'd/M/yyyy',
            'dd-MM-yyyy', 'd-M-yyyy',
            'dd.MM.yyyy', 'd.M.yyyy',

            // Month-first formats
            'MM/dd/yy', 'M/d/yy',
            'MM/dd/yyyy', 'M/d/yyyy',

            // Year-first format
            'yyyy-MM-dd',

            // Formats with month names (English and Spanish)
            'dd MMM yyyy', 'd MMM yyyy',
            'MMM dd yyyy', 'MMM d yyyy',
            'dd LLL yyyy', 'd LLL yyyy', // For Spanish month abbreviations
            'LLL dd yyyy', 'LLL d yyyy',

            // Compact formats (no separators)
            'yyyyMMdd',
            'ddMMyyyy',
            'ddMMyy',

            // Additional formats
            'dd.MM.yyyy', 'd.M.yyyy', // European format
            'dd.MM.yy', 'd.M.yy',
            'yy-MM-dd', // Military format
            'yyyy-MM-dd\'T\'HH:mm:ss', // ISO 8601
            'MM/dd/yyyy', 'M/d/yyyy', // 2-digit month/day

            // Colon-separated formats (DD:MM:YY and DD:MM:YYYY)
            'dd:MM:yy', 'd:M:yy',
            'dd:MM:yyyy', 'd:M:yyyy',
        ];

        for (const format of formats) {
            try {
                const parsed = parse(processedDateString, format, new Date());
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

    // Pre-process date string to handle special cases
    private preprocessDateString(dateString: string): string {
        let processed = dateString.trim();

        // Handle Spanish month abbreviations
        const spanishMonths: { [key: string]: string } = {
            'ene': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'abr': 'Apr',
            'may': 'May', 'jun': 'Jun', 'jul': 'Jul', 'ago': 'Aug',
            'sep': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dic': 'Dec'
        };

        // Handle Roman numerals for months
        const romanMonths: { [key: string]: string } = {
            'I': '01', 'II': '02', 'III': '03', 'IV': '04', 'V': '05', 'VI': '06',
            'VII': '07', 'VIII': '08', 'IX': '09', 'X': '10', 'XI': '11', 'XII': '12'
        };

        // Replace Spanish month abbreviations
        for (const [spanish, english] of Object.entries(spanishMonths)) {
            processed = processed.replace(new RegExp(spanish, 'gi'), english);
        }

        // Replace Roman numerals
        for (const [roman, arabic] of Object.entries(romanMonths)) {
            processed = processed.replace(new RegExp(`\\b${roman}\\b`, 'gi'), arabic);
        }

        // Handle colon-separated dates (convert DD:MM:YY to DD/MM/YY for parsing)
        // This handles formats like "31:05:25" -> "31/05/25"
        processed = processed.replace(/(\d{1,2}):(\d{1,2}):(\d{2,4})/g, '$1/$2/$3');

        return processed;
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