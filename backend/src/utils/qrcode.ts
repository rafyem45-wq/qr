// src/utils/qrcode.ts
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique QR data string for a user
 */
export const generateQrData = (userId: string): string => {
  const nonce = uuidv4().replace(/-/g, '').substring(0, 8);
  return `QRSYS:${userId}:${nonce}`;
};

/**
 * Generates a QR code as a base64 data URL
 */
export const generateQrCodeImage = async (data: string): Promise<string> => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
};

/**
 * Parses a QR data string and extracts the user ID
 * Expected format: QRSYS:{userId}:{nonce}
 */
export const parseQrData = (qrData: string): { userId: string; nonce: string } | null => {
  const parts = qrData.split(':');
  if (parts.length !== 3 || parts[0] !== 'QRSYS') {
    return null;
  }
  return { userId: parts[1], nonce: parts[2] };
};
