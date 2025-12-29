import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { fetchClassAttendance, markAsAlfa } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";
import type { ClassAttendance } from "../types/teacher";
import { QrCodeGenerator } from "../components/qr-code-generator";

export default function TeacherClassDetail() {
    const { classId } = useParams();
    const { session } = useAuth();
    const [students, setStudents] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQr, setShowQr] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [isMarking, setIsMarking] = useState(false);

    useEffect(() => {
        if (session?.access_token && classId) {
            fetchClassAttendance(classId, session.access_token)
                .then((data) => {
                    if (Array.isArray(data)) {
                        setStudents(data);
                    } else {
                        console.error("Invalid attendance data format:", data);
                        setStudents([]);
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [session, classId]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(students.map((s) => s.student_id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id: number) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter((sId) => sId !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };



    // ... existing imports

    const handleMarkAlfa = async () => {
        if (selectedStudents.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menandai ${selectedStudents.length} siswa sebagai ALFA?`)) return;
        if (!session?.access_token || !classId) return;

        setIsMarking(true);
        try {
            const result = await markAsAlfa(classId, selectedStudents, session.access_token);
            setSelectedStudents([]); // Clear selection
            toast.success(result.message);

            // Reload student table to show changes instantly
            setLoading(true);
            const data = await fetchClassAttendance(classId, session.access_token);
            if (Array.isArray(data)) {
                setStudents(data);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Gagal menandai ALFA");
        } finally {
            setIsMarking(false);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading attendance...</div>;

    const presentCount = students.filter((s) => s.status === "HADIR").length;
    const totalDisplayed = students.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Class Attendance</h2>
                    <p className="text-zinc-500">
                        Present: {presentCount} | Total: {totalDisplayed}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedStudents.length > 0 && (
                        <button
                            onClick={handleMarkAlfa}
                            disabled={isMarking}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                        >
                            {isMarking ? "Processing..." : `Tandai ALFA (${selectedStudents.length})`}
                        </button>
                    )}
                    <button
                        onClick={() => setShowQr(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Generate QR
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                            <th className="p-4 font-medium w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-zinc-300"
                                    checked={students.length > 0 && selectedStudents.length === students.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {students.map((student) => (
                            <tr key={student.student_id}>
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-zinc-300"
                                        checked={selectedStudents.includes(student.student_id)}
                                        onChange={() => handleSelectStudent(student.student_id)}
                                    />
                                </td>
                                <td className="p-4">{student.student_name}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
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
                                            {student.status}
                                        </span>
                                        {student.attachment_url && (
                                            <a
                                                href={student.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-zinc-400 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400"
                                                title="Lihat Lampiran"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showQr && classId && <QrCodeGenerator classId={classId} onClose={() => setShowQr(false)} />}
        </div>
    );
}
