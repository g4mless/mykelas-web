import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchTeacherClasses } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";
import type { ClassInfo } from "../types/teacher";

export default function TeacherDashboard() {
    const { session } = useAuth();
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.access_token) {
            fetchTeacherClasses(session.access_token)
                .then(setClasses)
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [session]);

    if (loading) return <div>Loading classes...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Classes</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
                    <Link
                        key={cls.id}
                        to={`/teacher/class/${cls.id}`}
                        className="block p-6 bg-white rounded-lg border border-zinc-200 shadow-sm hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">{cls.class_name}</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            {cls.total_students} Students
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
