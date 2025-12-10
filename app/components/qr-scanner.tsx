import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { submitQrAttendance } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";

interface QrScannerProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function QrScanner({ onClose, onSuccess }: QrScannerProps) {
    const { session } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 15, qrbox: undefined },
      /* verbose= */ false
        );

        scanner.render(
            async (decodedText) => {
                if (session?.access_token) {
                    try {
                        // Stop scanning temporarily or permanently
                        scanner.clear();
                        await submitQrAttendance(decodedText, session.access_token);
                        onSuccess();
                    } catch (err) {
                        setError((err as Error).message);
                    }
                }
            },
            (errorMessage) => {
                // parse error, ignore it.
            }
        );

        return () => {
            scanner.clear().catch((error) => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [session, onSuccess]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl max-w-sm w-full text-center space-y-4">
                <h3 className="text-lg font-bold">Scan QR Code</h3>
                {error ? (
                    <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                        <p>{error}</p>
                        <button
                            onClick={onClose}
                            className="mt-2 px-4 py-2 bg-red-200 hover:bg-red-300 rounded-md"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div id="reader" className="w-full"></div>
                )}
                {!error && (
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
