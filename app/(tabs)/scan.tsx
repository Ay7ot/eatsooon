import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
import { activityService } from '@/src/services/ActivityService';
import { ScanMode, scannerService, ScanResult } from '@/src/services/ScannerService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Linking,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// Custom Alert Modal
interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
        text: string;
        onPress: () => void;
        style?: 'default' | 'destructive';
    }>;
    onClose: () => void;
}

function CustomAlert({ visible, title, message, buttons, onClose }: CustomAlertProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.alertContainer}>
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>
                    <View style={styles.alertButtons}>
                        {buttons.map((button, index) => (
                            <Pressable
                                key={index}
                                style={[
                                    styles.alertButton,
                                    button.style === 'destructive' && styles.alertButtonDestructive
                                ]}
                                onPress={() => {
                                    button.onPress();
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.alertButtonText,
                                    button.style === 'destructive' && styles.alertButtonTextDestructive
                                ]}>
                                    {button.text}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function ScanScreen() {
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.PRODUCT);
    const [initialScanResult, setInitialScanResult] = useState<ScanResult | null>(null);
    const [cameraInitialized, setCameraInitialized] = useState(false);
    const [showAlert, setShowAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' }>;
    }>({ visible: false, title: '', message: '', buttons: [] });
    const cameraRef = useRef<CameraView>(null);
    const isProcessingRef = useRef(false);

    // Dynamic UI helpers
    const instructionText = () => {
        if (!cameraInitialized) return t('scan_initializing_camera');
        if (scanMode === ScanMode.EXPIRY_DATE) {
            return t('scan_expiry_instruction');
        }
        return t('scan_product_instruction');
    };

    const scanButtonLabel = () => {
        return scanMode === ScanMode.EXPIRY_DATE
            ? t('scan_button_scan_expiry')
            : t('scan_button_scan_product');
    };

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
        if (isScanning) return; // Prevent multiple scans
        if (isProcessingRef.current) return;
        if (scanMode !== ScanMode.PRODUCT) return;

        isProcessingRef.current = true;
        setIsScanning(true);

        try {
            if (scanMode === ScanMode.PRODUCT) {
                console.log(`📱 [ScanScreen] Barcode detected:`, {
                    barcode: result.data,
                    type: result.type,
                    timestamp: new Date().toISOString()
                });

                const scanResult = await scannerService.processBarcodeResult(result);

                console.log(`📱 [ScanScreen] Scan result received:`, {
                    isSuccess: scanResult.isSuccess,
                    hasProductInfo: scanResult.hasProductInfo,
                    hasExpiryDate: scanResult.hasExpiryDate,
                    productName: scanResult.productInfo?.productName || 'N/A',
                    category: scanResult.productInfo?.category || 'N/A',
                    hasImage: !!scanResult.productInfo?.imageUrl,
                    errorMessage: scanResult.errorMessage || 'N/A'
                });

                if (scanResult.isSuccess) {
                    await activityService.logScanPerformed(scanResult.productInfo?.productName);

                    if (scanResult.hasProductInfo) {
                        // Product found in database
                        if (!scanResult.hasExpiryDate) {
                            console.log(`📱 [ScanScreen] Product found but no expiry date - prompting user to scan expiry`);
                            // We have product info but no expiry date - ask user to scan expiry date
                            setInitialScanResult(scanResult);
                            setScanMode(ScanMode.EXPIRY_DATE);
                            setShowAlert({
                                visible: true,
                                title: t('scan_expiry_not_detected'),
                                message: t('scan_please_scan_expiry'),
                                buttons: [{ text: t('scan_ok'), onPress: () => { } }]
                            });
                        } else {
                            console.log(`📱 [ScanScreen] Complete product info found - navigating to confirmation`);
                            // We have all info - proceed to confirmation
                            navigateToConfirmation(scanResult);
                        }
                    } else {
                        // Product not found in database - inform user and offer options
                        console.log(`📱 [ScanScreen] Product not found in database - informing user`);

                        // Check if we have any OCR data (expiry dates) from the scan
                        const hasOCRData = scanResult.allDetectedDates.length > 0 || scanResult.recognizedText;

                        if (hasOCRData) {
                            // We have some OCR data - offer to use it or manual entry
                            setInitialScanResult(scanResult);
                            setShowAlert({
                                visible: true,
                                title: t('scan_product_not_found'),
                                message: t('scan_product_not_found_ocr_available'),
                                buttons: [
                                    {
                                        text: t('scan_use_ocr_data'),
                                        onPress: () => navigateToConfirmation(scanResult)
                                    },
                                    {
                                        text: t('scan_manual_entry'),
                                        onPress: handleManualEntry,
                                        style: 'default'
                                    }
                                ]
                            });
                        } else {
                            // No OCR data - inform user and offer manual entry
                            console.log(`📱 [ScanScreen] No OCR data available - informing user and offering manual entry`);
                            setShowAlert({
                                visible: true,
                                title: t('scan_product_not_found'),
                                message: t('scan_product_not_found_no_ocr'),
                                buttons: [
                                    {
                                        text: t('scan_manual_entry'),
                                        onPress: handleManualEntry,
                                        style: 'default'
                                    },
                                    {
                                        text: t('scan_try_again'),
                                        onPress: () => { }
                                    }
                                ]
                            });
                        }
                    }
                } else {
                    // Actual scan failure (not just product not found)
                    console.log(`📱 [ScanScreen] Scan failed - showing error alert`);
                    setShowAlert({
                        visible: true,
                        title: t('scan_error'),
                        message: scanResult.errorMessage || t('scan_scanning_failed'),
                        buttons: [{ text: t('scan_ok'), onPress: () => { } }]
                    });
                }
            } else {
                // Expiry date mode - we already have product info, just need expiry
                console.log(`📱 [ScanScreen] In expiry mode - navigating to confirmation`);
                navigateToConfirmation(initialScanResult!);
            }
        } catch (error) {
            console.error(`📱 [ScanScreen] Scanning error:`, error);
            setShowAlert({
                visible: true,
                title: t('scan_error'),
                message: `Failed to scan: ${error}`,
                buttons: [{ text: t('scan_ok'), onPress: () => { } }]
            });
        } finally {
            setIsScanning(false);
            isProcessingRef.current = false;
        }
    };

    const handleCapturePress = async () => {
        if (isScanning || !cameraRef.current) return;
        if (isProcessingRef.current) return;

        // In both PRODUCT and EXPIRY_DATE modes we attempt an OCR scan on the captured image.
        // For PRODUCT mode this gives us a chance to extract an expiry date even if the barcode was not detected automatically.
        // The logic below will merge any previously detected product information (if present) with the newly-detected expiry date.

        isProcessingRef.current = true;
        setIsScanning(true);

        try {
            // take photo (API differs per platform/version)
            // @ts-ignore
            const photo: any = await (cameraRef.current as any).takePhoto?.({ skipMetadata: true })
                ?? await (cameraRef.current as any).takePictureAsync?.();

            const imageUri = photo?.uri;
            if (!imageUri) throw new Error('Could not capture image');

            const result = await scannerService.scanImage(imageUri);

            const finalResult: ScanResult = {
                ...(initialScanResult ?? {}),
                detectedExpiryDate: result.detectedExpiryDate,
                allDetectedDates: result.allDetectedDates,
                hasExpiryDate: result.hasExpiryDate,
            } as ScanResult;

            navigateToConfirmation(finalResult);
        } catch (error) {
            console.error('Capture/recognition error:', error);
            setShowAlert({
                visible: true,
                title: t('scan_error'),
                message: `${error}`,
                buttons: [{ text: t('scan_ok'), onPress: () => { } }]
            });
        } finally {
            setIsScanning(false);
            isProcessingRef.current = false;
            setScanMode(ScanMode.PRODUCT);
            setInitialScanResult(null);
        }
    };

    const handleManualEntry = () => {
        console.log(`📱 [ScanScreen] User chose manual entry`);
        // Navigate to confirmation screen with empty data for manual entry
        router.push({
            pathname: '/product-confirmation',
            params: {
                detectedProductName: '',
                detectedExpiryDate: '',
                productImageUrl: '',
            },
        });
    };

    const navigateToConfirmation = (scanResult: ScanResult) => {
        router.push({
            pathname: '/product-confirmation',
            params: {
                detectedProductName: scanResult.productInfo?.productName || '',
                detectedExpiryDate: scanResult.detectedExpiryDate || '',
                productImageUrl: scanResult.productInfo?.imageUrl || '',
                detectedBarcode: scanResult.detectedBarcode || '',
            },
        });
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <CustomAppBar title="Eatsooon" />
                <View style={styles.centerContent}>
                    <MaterialIcons name="camera-alt" size={64} color={Colors.textTertiary} />
                    <Text style={styles.loadingText}>{t('scan_requesting_permissions')}</Text>
                </View>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <CustomAppBar title="Eatsooon" />
                <View style={styles.centerContent}>
                    <MaterialIcons name="camera-alt" size={64} color={Colors.textTertiary} />
                    <Text style={styles.permissionText}>
                        {permission.canAskAgain
                            ? t('scan_camera_permission_required')
                            : t('scan_camera_permission_denied_permanently')}
                    </Text>
                    <Pressable
                        style={styles.permissionButton}
                        onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
                    >
                        <Text style={styles.permissionButtonText}>
                            {permission.canAskAgain ? t('scan_grant_permission') : t('scan_open_settings')}
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            <View style={styles.content}>
                {/* Camera Preview Section */}
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                        }}
                        onBarcodeScanned={scanMode === ScanMode.PRODUCT && !isScanning ? handleBarCodeScanned : undefined}
                        onCameraReady={() => setCameraInitialized(true)}
                    >
                        {/* Scanning Overlay */}
                        {isScanning && (
                            <View style={styles.scanningOverlay}>
                                <View style={styles.scanningContent}>
                                    <MaterialIcons name="qr-code-scanner" size={32} color="#FFFFFF" />
                                    <Text style={styles.scanningText}>{t('scan_scanning_product')}</Text>
                                    <Text style={styles.scanningSubText}>{t('scan_detecting_barcodes')}</Text>
                                </View>
                            </View>
                        )}

                        {/* Scan Frame Overlay */}
                        {!isScanning && <ScanFrameOverlay />}
                    </CameraView>
                </View>

                {/* Instructions and Actions */}
                <SafeAreaView style={styles.bottomSection}>
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Instructions */}
                        <View style={styles.instructionsContainer}>
                            <Text style={styles.instructionsText}>{instructionText()}</Text>
                        </View>

                        {/* Scan Button */}
                        <Pressable
                            style={[styles.scanButton, (isScanning || !cameraInitialized) && styles.scanButtonDisabled]}
                            onPress={handleCapturePress}
                            disabled={isScanning || !cameraInitialized}
                        >
                            {isScanning ? (
                                <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                            ) : (
                                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                            )}
                            <Text style={styles.scanButtonText}>{scanButtonLabel()}</Text>
                        </Pressable>

                        {/* Manual Entry Option */}
                        <Pressable
                            style={styles.manualEntryButton}
                            onPress={handleManualEntry}
                            disabled={isScanning}
                        >
                            <Text style={styles.manualEntryText}>{t('scan_enter_manual')}</Text>
                        </Pressable>
                    </ScrollView>
                </SafeAreaView>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={showAlert.visible}
                title={showAlert.title}
                message={showAlert.message}
                buttons={showAlert.buttons}
                onClose={() => setShowAlert(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

function ScanFrameOverlay() {
    const screenWidth = Dimensions.get('window').width;
    const frameSize = screenWidth * 0.7;

    return (
        <View style={styles.frameOverlay}>
            <View
                style={[
                    styles.scanFrame,
                    {
                        width: frameSize,
                        height: frameSize,
                    }
                ]}
            >
                {/* Corner frames */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    content: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 16,
        textAlign: 'center',
    },
    permissionText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: Colors.secondaryColor,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    permissionButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    cameraContainer: {
        height: Dimensions.get('window').height * 0.50,
        margin: 16,
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000000',
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    camera: {
        flex: 1,
    },
    scanningOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanningContent: {
        alignItems: 'center',
    },
    scanningText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#FFFFFF',
        marginTop: 16,
    },
    scanningSubText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 8,
    },
    frameOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    bottomSection: {
        backgroundColor: Colors.backgroundColor,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    instructionsContainer: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginBottom: 16,
    },
    instructionsText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#1E40AF',
        textAlign: 'center',
        lineHeight: 16,
    },
    scanButton: {
        backgroundColor: Colors.secondaryColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 8,
    },
    scanButtonDisabled: {
        backgroundColor: Colors.textTertiary,
    },
    scanButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
        marginLeft: 8,
    },
    manualEntryButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    manualEntryText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textTertiary,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Alert styles
    alertContainer: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    alertTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 20,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    alertMessage: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    alertButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: Colors.secondaryColor,
        alignItems: 'center',
    },
    alertButtonDestructive: {
        backgroundColor: Colors.red,
    },
    alertButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    alertButtonTextDestructive: {
        color: Colors.backgroundWhite,
    },
});

