"use client";

import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../providers/auth-provider";
import { useTeacher } from "../providers/teacher-provider";

const FullPageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-sm border-4 border-zinc-200 border-t-sky-500 dark:border-zinc-800" />
    </div>
);

export default function TeacherProtectedLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { session, isLoading: authLoading } = useAuth();
    const { teacher, isLoading: teacherLoading } = useTeacher();

    useEffect(() => {
        if (!authLoading && !session) {
            navigate("/login", { replace: true, state: { from: location.pathname } });
        }
    }, [session, authLoading, navigate, location.pathname]);

    useEffect(() => {
        if (!teacherLoading && session && !teacher) {
            // If logged in but not a teacher, redirect to student home
            navigate("/", { replace: true });
        }
    }, [teacher, teacherLoading, session, navigate]);

    if (authLoading || teacherLoading) {
        return <FullPageLoader />;
    }

    if (!session || !teacher) {
        return <FullPageLoader />;
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
            <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
                    <div>
                        <p className="text-sm text-zinc-500">Teacher Portal</p>
                        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{teacher.nama}</h1>
                    </div>
                    <div className="flex flex-1 items-center justify-end">
                        <Link
                            to="/teacher/dashboard"
                            className="text-sm font-medium hover:underline"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
