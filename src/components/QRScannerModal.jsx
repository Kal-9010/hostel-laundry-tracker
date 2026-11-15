import React, { useEffect, useRef, useState } from 'react';
import { X, QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScannerModal({ isOpen, onClose, onSelectMachine }) {
  const [showMockQRs, setShowMockQRs] = useState(false);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const html5QrCode = new Html5Qrcode('qr-reader-container');
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (!isMounted) return;
          const match = decodedText.match(/machine=([1-5])/i);
          if (match) {
            const machineId = parseInt(match[1], 10);
            html5QrCode.stop().catch(() => {});
            onSelectMachine(machineId);
          } else {
            setScanError(`Unrecognized QR code: ${decodedText}`);
          }
        },
        () => {}
      )
      .catch((err) => {
        if (isMounted) {
          setScanError(err?.message || 'Camera access denied or unavailable.');
        }
      });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, onSelectMachine]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hostel-laundry.vercel.app';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Live Camera QR Scan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div
            id="qr-reader-container"
            className="w-full min-h-[240px] rounded-xl overflow-hidden bg-slate-900"
          />
          {scanError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              {scanError}
            </p>
          )}
          <p className="text-xs text-slate-500 text-center">
            Point your camera at the machine&apos;s QR sticker (<code className="bg-slate-100 px-1 rounded">?machine=1..5</code>) to start a wash.
          </p>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowMockQRs((v) => !v)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              {showMockQRs ? 'Hide Mock QR Codes' : 'View / Print Mock QR Codes'}
            </button>

            {showMockQRs && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5].map((id) => (
                  <div
                    key={id}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <QRCodeSVG value={`${origin}/?machine=${id}`} size={84} />
                    <span className="text-xs font-bold text-slate-800">Machine {id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
