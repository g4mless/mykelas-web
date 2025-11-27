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
  fetchProfilePicture,
  linkStudent as linkStudentRequest,
  submitAttendance,
  uploadProfilePicture,
  KlasApiError,
} from "../lib/klas-api";
import { useAuth } from "./auth-provider";

interface StudentContextValue {
  student: Student | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  linkStudent: (name: string) => Promise<void>;
  submitAttendance: (status: AttendanceStatus) => Promise<AttendanceResponse>;
  avatarUrl: string | null;
  avatarError: string | null;
  isAvatarLoading: boolean;
  refreshAvatar: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | undefined>(undefined);

export const StudentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { session } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;
  const userId = session?.user.id ?? null;

  // isLoading is true if we are actively fetching OR if the loaded data corresponds to a different user (or no user yet)
  const isLoading = isFetching || (userId !== loadedUserId);

  const loadStudent = useCallback(async () => {
    // If no session, we are "done" loading (nothing to load)
    if (!accessToken || !userId) {
      setStudent(null);
      setError(null);
      setAvatarUrl(null);
      setAvatarError(null);
      setLoadedUserId(null);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const students = await fetchStudents(accessToken);
      const match = students.find((candidate) => candidate.user_id === userId);
      setStudent(match ?? null);
      setAvatarUrl(match?.avatar_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load student data");
      setStudent(null);
      setAvatarUrl(null);
    } finally {
      setIsFetching(false);
      setLoadedUserId(userId);
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

  const refreshAvatar = useCallback(async () => {
    if (!accessToken) {
      throw new Error("Missing access token");
    }
    setIsAvatarLoading(true);
    setAvatarError(null);
    try {
      const data = await fetchProfilePicture(accessToken);
      setAvatarUrl(data.avatar_url ?? null);
    } catch (err) {
      if (err instanceof KlasApiError && err.status === 404) {
        setAvatarUrl(null);
        setAvatarError(null);
      } else {
        setAvatarError(err instanceof Error ? err.message : "Gagal memuat foto");
      }
    } finally {
      setIsAvatarLoading(false);
    }
  }, [accessToken]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      const result = await uploadProfilePicture(file, accessToken);
      setAvatarUrl(result.avatar_url ?? null);
      await loadStudent();
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
      avatarUrl,
      avatarError,
      isAvatarLoading,
      refreshAvatar,
      uploadAvatar,
    }),
    [
      student,
      isLoading,
      error,
      loadStudent,
      handleLinkStudent,
      handleAttendance,
      avatarUrl,
      avatarError,
      isAvatarLoading,
      refreshAvatar,
      uploadAvatar,
    ],
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
