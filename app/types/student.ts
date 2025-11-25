export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT";

export interface Attendance {
  id: number;
  status: AttendanceStatus;
  date: string;
  student_id: number;
}

export interface Student {
  id: number;
  nisn: string;
  nama: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  tempat_lahir: string;
  alamat: string;
  kelas: number | string;
  user_id?: string | null;
  last_status?: AttendanceStatus | null;
  last_date?: string | null;
  class?: {
    class_name: string;
  } | null;
}

export interface AttendanceResponse {
  message: string;
  attendance?: Attendance;
}

export interface TodayStatusResponse {
  has_attendance: boolean;
  attendance?: Attendance;
}
