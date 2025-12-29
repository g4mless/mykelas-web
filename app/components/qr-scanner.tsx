import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";
import { submitQrAttendance } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";

interface QrScannerProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function QrScanner({ onClose, onSuccess }: QrScannerProps) {
    const { session } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [scanned, setScanned] = useState(false);

    const handleScan = async (detectedCodes: { rawValue: string }[]) => {
        if (scanned || !session?.access_token || detectedCodes.length === 0) return;

        const token = detectedCodes[0].rawValue;
        if (!token) return;

        setScanned(true); // Prevent multiple submissions
        try {
            await submitQrAttendance(token, session.access_token);
            onSuccess();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-linear-to-b from-black/80 to-transparent flex justify-between items-start">
                    <h3 className="text-white font-bold text-lg drop-shadow-md">Scan QR Code</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Scanner */}
                <div className="relative aspect-square bg-black">
                    {!error ? (
                        <Scanner
                            onScan={handleScan}
                            onError={(err) => console.error(err)}
                            components={{
                                onOff: false,
                                torch: true,
                                zoom: true,
                                finder: true,
                            }}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: { objectFit: "cover" }
                            }}
                            constraints={{
                                facingMode: "environment"
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white p-6 text-center">
                            <div className="space-y-4">
                                <div className="text-red-500 mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                </div>
                                <p className="text-zinc-300">{error}</p>
                                <button
                                    onClick={() => {
                                        setError(null);
                                        setScanned(false);
                                    }}
                                    className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer instructions */}
                {!error && (
                    <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-center">
                        <p className="text-sm text-zinc-400">
                            Point your camera at the QR code to sign attendance.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
