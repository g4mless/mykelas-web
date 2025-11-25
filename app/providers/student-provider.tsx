"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  AttendanceResponse,
  AttendanceStatus,
  Student,
} from "../types/student";
import {
  fetchStudents,
  linkStudent as linkStudentRequest,
  submitAttendance,
} from "../lib/klas-api";
import { useAuth } from "./auth-provider";

interface StudentContextValue {
  student: Student | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  linkStudent: (name: string) => Promise<void>;
  submitAttendance: (status: AttendanceStatus) => Promise<AttendanceResponse>;
}

const StudentContext = createContext<StudentContextValue | undefined>(undefined);

export const StudentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { session } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;
  const userId = session?.user.id ?? null;

  const loadStudent = useCallback(async () => {
    if (!accessToken || !userId) {
      setStudent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const students = await fetchStudents(accessToken);
      const match = students.find((candidate) => candidate.user_id === userId);
      setStudent(match ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load student data");
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleLinkStudent = useCallback(
    async (name: string) => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      await linkStudentRequest(name, accessToken);
      await loadStudent();
    },
    [accessToken, loadStudent],
  );

  const handleAttendance = useCallback(
    async (status: AttendanceStatus) => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      const response = await submitAttendance(status, accessToken);
      await loadStudent();
      return response;
    },
    [accessToken, loadStudent],
  );

  const value = useMemo<StudentContextValue>(
    () => ({
      student,
      isLoading,
      error,
      refresh: loadStudent,
      linkStudent: handleLinkStudent,
      submitAttendance: handleAttendance,
    }),
    [student, isLoading, error, loadStudent, handleLinkStudent, handleAttendance],
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within StudentProvider");
  }
  return context;
};
