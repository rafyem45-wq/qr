// src/pages/ScannerPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { VerifyResult } from '@/types';
import { format } from 'date-fns';

type ScanState = 'idle' | 'scanning' | 'result';

export const ScannerPage: React.FC = () => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    processingRef.current = false;

    await stopScanner();

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No camera found on this device.');
        return;
      }

      // Prefer back camera on mobile
      const cameraId =
        cameras.find((c) => c.label.toLowerCase().includes('back'))?.id || cameras[0].id;

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          await stopScanner();
          setScanState('result');
          setLoading(true);

          try {
            const { data } = await api.post('/scanner/verify', {
              qr_data: decodedText,
              scanner_info: navigator.userAgent,
            });
            setVerifyResult(data.data);
          } catch {
            toast.error('Verification request failed');
            setVerifyResult({
              valid: false,
              message: 'Network error during verification',
            });
          } finally {
            setLoading(false);
          }
        },
        () => { /* ignore per-frame errors */ }
      );

      setScanState('scanning');
    } catch (err) {
      console.error(err);
      const msg = String(err).includes('Permission')
        ? 'Camera permission denied. Please allow camera access.'
        : 'Failed to start camera. Please try again.';
      setCameraError(msg);
    }
  }, [stopScanner]);

  const reset = useCallback(async () => {
    await stopScanner();
    setVerifyResult(null);
    processingRef.current = false;
    setScanState('idle');
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">QR Scanner</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Scan a QR code to verify a user</p>
      </div>

      {/* Scanner card */}
      <div className="card overflow-hidden">
        {/* Camera viewport */}
        <div className="relative bg-zinc-950 aspect-square max-h-[400px] flex items-center justify-center">
          {/* Html5Qrcode mount point */}
          <div
            id="qr-reader"
            className="w-full h-full"
            style={{ display: scanState === 'scanning' ? 'block' : 'none' }}
          />

          {/* Idle state */}
          {scanState === 'idle' && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-brand-400" />
                </div>
                {/* Pulse rings */}
                <div className="absolute inset-0 rounded-3xl border border-brand-500/30 animate-pulse-ring" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-300">Camera ready</p>
                <p className="text-xs text-zinc-600 mt-1">Click below to start scanning</p>
              </div>
            </div>
          )}

          {/* Scanning overlay */}
          {scanState === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner guides */}
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                {/* Scan line */}
                <div className="absolute inset-x-0 h-0.5 bg-brand-400/60 top-1/2 animate-pulse" />
              </div>
            </div>
          )}

          {/* Result state */}
          {scanState === 'result' && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
                  <p className="text-sm text-zinc-400">Verifying...</p>
                </div>
              ) : verifyResult ? (
                <div className="w-full animate-scale-in">
                  <div
                    className={`rounded-2xl p-6 border ${
                      verifyResult.valid
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex flex-col items-center mb-4">
                      {verifyResult.valid ? (
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-400 mb-2" />
                      )}
                      <h3
                        className={`text-lg font-bold ${
                          verifyResult.valid ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        {verifyResult.valid ? 'Verified!' : 'Invalid QR'}
                      </h3>
                      <p className="text-sm text-zinc-400 text-center mt-1">{verifyResult.message}</p>
                    </div>

                    {verifyResult.user && (
                      <div className="space-y-2.5 mt-4 pt-4 border-t border-zinc-700">
                        <div className="flex items-center gap-2.5 text-sm">
                          <User className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <span className="text-zinc-200 font-medium">{verifyResult.user.full_name}</span>
                        </div>
                        {verifyResult.user.email && (
                          <div className="flex items-center gap-2.5 text-sm">
                            <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                            <span className="text-zinc-400">{verifyResult.user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-sm">
                          <Shield className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <span
                            className={`font-medium ${
                              verifyResult.user.status === 'active'
                                ? 'text-emerald-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {verifyResult.user.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <Calendar className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <span className="text-zinc-500 text-xs">
                            Member since{' '}
                            {format(new Date(verifyResult.user.created_at), 'MMMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Camera error */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <CameraOff className="w-10 h-10 text-red-400" />
              <p className="text-sm text-red-300">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-5 border-t border-zinc-800">
          {scanState === 'idle' && (
            <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              Start Camera
            </button>
          )}

          {scanState === 'scanning' && (
            <button onClick={reset} className="btn-secondary w-full flex items-center justify-center gap-2">
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          )}

          {scanState === 'result' && !loading && (
            <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Scan Again
            </button>
          )}

          {cameraError && (
            <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2 mt-3">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-600 text-center mt-4">
        Point the camera at a QR code to verify instantly
      </p>
    </div>
  );
};
