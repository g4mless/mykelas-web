import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQrToken } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";

interface QrCodeGeneratorProps {
    classId: string;
    onClose: () => void;
}

export function QrCodeGenerator({ classId, onClose }: QrCodeGeneratorProps) {
    const { session } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!session?.access_token) return;

        const fetchToken = async () => {
            try {
                const data = await generateQrToken(classId, session.access_token);
                setToken(data.token);
                setTimeLeft(data.expires_in);
            } catch (err) {
                console.error("Failed to generate QR token", err);
            }
        };

        fetchToken();

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 5) { // Refresh a bit earlier
                    if (prev === 1) fetchToken();
                    return prev - 1;
                }
                return prev - 1;
            });
        }, 1000);

        // Actually, better logic:
        // Set an interval to fetch every 55 seconds
        const refreshInterval = setInterval(fetchToken, 55000);

        return () => {
            clearInterval(interval);
            clearInterval(refreshInterval);
        };
    }, [classId, session]);

    // Separate timer for display
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl max-w-sm w-full text-center space-y-4">
                <h3 className="text-lg font-bold">Scan for Attendance</h3>
                <div className="flex justify-center bg-white p-4 rounded-lg">
                    {token ? (
                        <QRCodeSVG value={token} size={200} />
                    ) : (
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            Loading...
                        </div>
                    )}
                </div>
                <p className="text-sm text-zinc-500">
                    Refreshes automatically
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-2 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
