/**
 * studentsService.ts
 *
 * Servicio de datos para el módulo de estudiantes.
 * Consume la API real del backend.
 */

import { apiFetch } from './apiClient';
import type { BackendStudent } from '../types/student';

// ─── Interfaces ────────────────────────────────────────────────────

/** Dominios válidos para correo institucional */
export const ALLOWED_EMAIL_DOMAINS = ['@miumg.edu.gt', '@umg.edu.gt'];

/** Semestre devuelto por GET /api/semesters */
export interface Semester {
    id: string;
    nombre: string;
    anio: number;
    numero: number;
}

/** Payload para crear un estudiante (campos que envía el formulario) */
export interface StudentPayload {
    nombreCompleto: string;
    carnetId: string;
    correoInstitucional: string;
    /** UUID del semestre */
    semesterId: string;
    /** ID numérico de la fase en academic_phases */
    academicPhaseId: number;
}

/** Una fila parseada de un archivo Excel/CSV */
export interface ParsedRow {
    rowIndex: number;
    nombreCompleto?: string;
    carnetId?: string;
    correoInstitucional?: string;
    semestreLectivo?: string;
    [key: string]: unknown;
}

/** Resultado de una importación masiva */
export interface ImportResult {
    imported: number;
    rejected: number;
    errors: Array<{ row: number; reason: string }>;
}

/** Respuesta del endpoint POST /api/students/bulk */
interface BulkResponse {
    importados: number;
    rechazados: number;
    total: number;
    errores: Array<{ fila: number; carnet_id: string; razon: string }>;
}

/** Ítem de carga reciente (historial local) */
export interface UploadItem {
    id: string;
    filename: string;
    status: 'success' | 'error' | 'pending';
    uploadedAt: string;
    type: 'excel' | 'pdf';
}

// ─── Semesters ──────────────────────────────────────────────────────

export async function getSemesters(): Promise<Semester[]> {
    return apiFetch<Semester[]>('/semesters');
}

// ─── Estudiantes ─────────────────────────────────────────────────────

/**
 * Registra un estudiante via POST /api/students.
 * Envía academic_phase_id (nuevo campo relacional).
 */
export async function createStudent(payload: StudentPayload): Promise<BackendStudent> {
    return apiFetch<BackendStudent>('/students', {
        method: 'POST',
        body: JSON.stringify({
            nombre_completo:      payload.nombreCompleto.trim(),
            carnet_id:            payload.carnetId.trim(),
            correo_institucional: payload.correoInstitucional.trim(),
            semester_id:          payload.semesterId,
            academic_phase_id:    payload.academicPhaseId,
            approved:             false,
        }),
    });
}

// ─── Historial ────────────────────────────────────────────────────────

interface BackendUpload {
    id: string;
    filename: string;
    type: 'excel' | 'pdf';
    status: 'success' | 'error';
    imported: number;
    rejected: number;
    created_at: string;
}

/**
 * Importa filas desde Excel/CSV usando POST /api/students/bulk.
 * Acepta defaultPhaseId para asignar la misma fase a todas las filas.
 */
export async function importStudents(
    rows: ParsedRow[],
    semesterId?: string,
    defaultPhaseId?: number,
): Promise<ImportResult> {
    const filas = rows.map((row) => ({
        nombre_completo:      (row.nombreCompleto ?? '').trim(),
        carnet_id:            (row.carnetId ?? '').trim(),
        correo_institucional: (row.correoInstitucional ?? '').trim(),
        academic_phase_id:    defaultPhaseId,
        semester_id:          semesterId ?? (row.semestreLectivo ?? '').trim(),
        approved:             false,
    }));

    const resp = await apiFetch<BulkResponse>('/students/bulk', {
        method: 'POST',
        body: JSON.stringify({ filas }),
    });

    return {
        imported: resp.importados,
        rejected: resp.rechazados,
        errors:   resp.errores.map((e) => ({ row: e.fila, reason: e.razon })),
    };
}

export async function uploadPdf(_file: File): Promise<void> {
    // PDF processing is handled server-side when backend endpoint is added
}

export async function downloadTemplate(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const base  = import.meta.env.VITE_API_URL ?? '/api';
    const res   = await fetch(`${base}/students/template`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('No se pudo descargar la plantilla');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'plantilla_estudiantes.xlsx';
    a.click();
    URL.revokeObjectURL(url);
}

export async function getRecentUploads(): Promise<UploadItem[]> {
    const rows = await apiFetch<BackendUpload[]>('/uploads');
    return rows.map((r) => ({
        id: r.id,
        filename: r.filename,
        type: r.type,
        status: r.status,
        uploadedAt: new Date(r.created_at).toLocaleString('es-GT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }),
    }));
}
