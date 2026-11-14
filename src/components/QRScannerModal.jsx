import React, { useEffect, useRef, useState } from 'react';
import { X, QrCode, Camera, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScannerModal({ isOpen, onClose, onSelectMachine }) {
  const [tab, setTab] = useState('simulator');
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || tab !== 'camera') return;

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
  }, [isOpen, tab, onSelectMachine]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hostel-laundry.vercel.app';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Scan Machine QR Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setScanError('');
              setTab('simulator');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'simulator'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1-Tap QR Simulator
          </button>
          <button
            onClick={() => {
              setScanError('');
              setTab('camera');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'camera'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera Scan
          </button>
        </div>

        <div className="p-5">
          {tab === 'simulator' ? (
            <div>
              <p className="text-xs text-slate-500 mb-4">
                Tap any machine sticker below to simulate scanning its physical QR code:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5].map((id) => (
                  <button
                    key={id}
                    onClick={() => onSelectMachine(id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition group"
                  >
                    <QRCodeSVG value={`${origin}/?machine=${id}`} size={76} />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                      Machine {id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
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
                Point your camera at a printed sticker encoding <code className="bg-slate-100 px-1 rounded">?machine=1..5</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
