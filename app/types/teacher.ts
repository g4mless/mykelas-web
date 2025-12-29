export interface Teacher {
  id: number;
  nuptk: string;
  nama: string;
  user_id?: string;
}

export interface ClassInfo {
  id: number;
  class_name: string;
  total_students: number;
}

export interface ClassAttendance {
  student_id: number;
  student_name: string;
  status: string; // "HADIR", "IZIN", "SAKIT"
  avatar_url?: string | null;
  attachment_url?: string | null;
}

export interface QrTokenResponse {
  token: string;
  expires_in: number;
}
