import type {
  AttendanceResponse,
  AttendanceStatus,
  ProfilePictureInfo,
  ProfilePictureUploadResponse,
  Student,
  TodayStatusResponse,
} from "../types/student";
import type {
  ClassAttendance,
  ClassInfo,
  QrTokenResponse,
  Teacher,
} from "../types/teacher";
import { KLAS_API_URL } from "./env";

class KlasApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> => {
  const isFormData = init?.body instanceof FormData;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...init?.headers,
  } as HeadersInit;

  const response = await fetch(`${KLAS_API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new KlasApiError(message.message ?? response.statusText, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const fetchStudents = async (accessToken: string) => {
  return request<Student[]>("/students", accessToken, {
    method: "GET",
  });
};

export const linkStudent = async (name: string, accessToken: string) => {
  return request<{ message: string }>("/auth/link-student", accessToken, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
};

export const submitAttendance = async (
  status: AttendanceStatus,
  accessToken: string,
) => {
  return request<AttendanceResponse>("/absen", accessToken, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
};

export const fetchTodayStatus = (accessToken: string) => {
  return request<TodayStatusResponse>("/today-status", accessToken, {
    method: "GET",
  });
};

export const fetchProfilePicture = (accessToken: string) => {
  return request<ProfilePictureInfo>("/students/profile-picture", accessToken, {
    method: "GET",
  });
};

export const uploadProfilePicture = (file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return request<ProfilePictureUploadResponse>(
    "/students/profile-picture",
    accessToken,
    {
      method: "POST",
      body: formData,
    },
  );
};

// Teacher Auth
export const loginTeacher = async (nuptk: string) => {
  return request<{
    access_token: string;
    refresh_token: string;
    teacher: Teacher;
  }>("/auth/login/teacher", "", {
    method: "POST",
    body: JSON.stringify({ nuptk }),
  });
};

// Teacher Data
export const fetchTeacherClasses = async (accessToken: string) => {
  return request<ClassInfo[]>("/teacher/classes", accessToken, {
    method: "GET",
  });
};

export const fetchClassAttendance = async (
  classId: string,
  accessToken: string,
) => {
  return request<ClassAttendance[]>(
    `/teacher/attendances/today?class_id=${classId}`,
    accessToken,
    {
      method: "GET",
    },
  );
};

// QR Features
export const generateQrToken = async (classId: string, accessToken: string) => {
  return request<QrTokenResponse>("/teacher/qr/generate", accessToken, {
    method: "POST",
    body: JSON.stringify({ class_id: classId }),
  });
};

export const submitQrAttendance = async (token: string, accessToken: string) => {
  return request<AttendanceResponse>("/absen/qr", accessToken, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
};

export { KlasApiError };
