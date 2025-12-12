import { useEffect, useState } from "react";
import { fetchClassAttendance, fetchTeacherClasses } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";
import type { ClassInfo, ClassAttendance } from "../types/teacher";
import { QrCodeGenerator } from "../components/qr-code-generator";

export default function TeacherDashboard() {
    const { session } = useAuth();
    const accessToken = session?.access_token;
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [students, setStudents] = useState<ClassAttendance[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [showQr, setShowQr] = useState(false);

    // Fetch classes on mount
    useEffect(() => {
        if (accessToken) {
            fetchTeacherClasses(accessToken)
                .then((data) => {
                    setClasses(data);
                    // Auto-select first class if available
                    if (data.length > 0) {
                        setSelectedClassId(data[0].id.toString());
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => setLoadingClasses(false));
        }
    }, [accessToken]);

    // Fetch attendance when class changes
    useEffect(() => {
        if (accessToken && selectedClassId) {
            setLoadingAttendance(true);
            fetchClassAttendance(selectedClassId, accessToken)
                .then((data) => {
                    if (Array.isArray(data)) {
                        setStudents(data);
                    } else {
                        console.error("Invalid attendance data format:", data);
                        setStudents([]);
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => setLoadingAttendance(false));
        }
    }, [accessToken, selectedClassId]);

    // Refresh attendance data
    const refreshAttendance = () => {
        if (accessToken && selectedClassId) {
            setLoadingAttendance(true);
            fetchClassAttendance(selectedClassId, accessToken)
                .then((data) => {
                    if (Array.isArray(data)) {
                        setStudents(data);
                    } else {
                        setStudents([]);
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => setLoadingAttendance(false));
        }
    };

    if (loadingClasses) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-zinc-500">Loading classes...</span>
            </div>
        );
    }

    if (classes.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-500">No classes assigned to you.</p>
            </div>
        );
    }

    const selectedClass = classes.find((c) => c.id.toString() === selectedClassId);
    const presentCount = students.filter((s) => s.status === "HADIR").length;
    const belumAbsenCount = students.filter((s) => s.status === "BELUM ABSEN").length;

    return (
        <div className="space-y-6">
            {/* Header with Class Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Attendance</h2>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                    >
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id.toString()}>
                                {cls.class_name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setShowQr(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    Generate QR
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-green-100 text-sm font-medium">Hadir</p>
                    <p className="text-3xl font-bold">{presentCount}</p>
                </div>
                <div className="bg-zinc-500 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-zinc-200 text-sm font-medium">Belum Absen</p>
                    <p className="text-3xl font-bold">{belumAbsenCount}</p>
                </div>
                <div className="bg-zinc-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-zinc-300 text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold">{students.length}</p>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-lg">Today's Attendance</h3>
                        <p className="text-sm text-zinc-500">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <button
                        onClick={refreshAttendance}
                        disabled={loadingAttendance}
                        className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                        title="Refresh"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${loadingAttendance ? 'animate-spin' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {loadingAttendance ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-zinc-500">Loading attendance...</span>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-zinc-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-zinc-500">No attendance recorded yet.</p>
                        <p className="text-zinc-400 text-sm mt-1">Generate a QR code to start taking attendance.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                            <tr>
                                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">Student</th>
                                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {students.map((student) => (
                                <tr key={student.student_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {student.avatar_url ? (
                                                <img
                                                    src={student.avatar_url}
                                                    alt={student.student_name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                                    {student.student_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium">{student.student_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${student.status === "HADIR"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : student.status === "BELUM ABSEN"
                                                    ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                                    : student.status === "IZIN"
                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        : student.status === "SAKIT"
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                }`}
                                        >
                                            {student.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showQr && selectedClassId && (
                <QrCodeGenerator classId={selectedClassId} onClose={() => setShowQr(false)} />
            )}
        </div>
    );
}
