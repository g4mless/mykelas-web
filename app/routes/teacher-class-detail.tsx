import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { fetchClassAttendance } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";
import type { ClassAttendance } from "../types/teacher";
import { QrCodeGenerator } from "../components/qr-code-generator";

export default function TeacherClassDetail() {
    const { classId } = useParams();
    const { session } = useAuth();
    const [students, setStudents] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQr, setShowQr] = useState(false);

    useEffect(() => {
        if (session?.access_token && classId) {
            fetchClassAttendance(classId, session.access_token)
                .then(setStudents)
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [session, classId]);

    if (loading) return <div>Loading attendance...</div>;

    const presentCount = students.filter((s) => s.status === "HADIR").length;
    const alphaCount = students.filter((s) => !s.status).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Class Attendance</h2>
                    <p className="text-zinc-500">
                        Present: {presentCount} | Alpha: {alphaCount}
                    </p>
                </div>
                <button
                    onClick={() => setShowQr(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    Generate QR
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {students.map((student) => (
                            <tr key={student.student_id}>
                                <td className="p-4">{student.student_name}</td>
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === "HADIR"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : student.status === "IZIN"
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    : student.status === "SAKIT"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                                            }`}
                                    >
                                        {student.status || "ALPHA"}
                                    </span>
                                </td>
                                <td className="p-4 text-zinc-500">
                                    {student.time ? new Date(student.time).toLocaleTimeString() : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showQr && classId && (
                <QrCodeGenerator classId={classId} onClose={() => setShowQr(false)} />
            )}
        </div>
    );
}
