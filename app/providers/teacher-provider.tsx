"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import type { Teacher } from "../types/teacher";

interface TeacherContextType {
    teacher: Teacher | null;
    setTeacher: (teacher: Teacher | null) => void;
    isLoading: boolean;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export function TeacherProvider({ children }: { children: ReactNode }) {
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load teacher from local storage
        const storedTeacher = localStorage.getItem("teacher_data");
        if (storedTeacher) {
            try {
                setTeacher(JSON.parse(storedTeacher));
            } catch (e) {
                console.error("Failed to parse teacher data", e);
            }
        }
        setIsLoading(false);
    }, []);

    const handleSetTeacher = (data: Teacher | null) => {
        setTeacher(data);
        if (data) {
            localStorage.setItem("teacher_data", JSON.stringify(data));
        } else {
            localStorage.removeItem("teacher_data");
        }
    };

    return (
        <TeacherContext.Provider
            value={{ teacher, setTeacher: handleSetTeacher, isLoading }}
        >
            {children}
        </TeacherContext.Provider>
    );
}

export function useTeacher() {
    const context = useContext(TeacherContext);
    if (context === undefined) {
        throw new Error("useTeacher must be used within a TeacherProvider");
    }
    return context;
}
