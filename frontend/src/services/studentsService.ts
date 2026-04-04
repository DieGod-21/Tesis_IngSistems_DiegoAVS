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

/** Fases académicas válidas según el backend */
export const FASES_VALIDAS = ['anteproyecto', 'tesis', 'eps'] as const;
export type FaseValida = typeof FASES_VALIDAS[number];

/** Etiquetas de display para cada fase */
export const FASE_LABELS: Record<FaseValida, string> = {
    anteproyecto: 'Anteproyecto de Tesis',
    tesis:        'Tesis de Grado',
    eps:          'Ejercicio Profesional Supervisado (EPS)',
};

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
    faseAcademica: string;
}

/** Una fila parseada de un archivo Excel/CSV */
export interface ParsedRow {
    rowIndex: number;
    nombreCompleto?: string;
    carnetId?: string;
    correoInstitucional?: string;
    semestreLectivo?: string;
    faseAcademica?: string;
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

/** Obtiene la lista de semestres desde GET /api/semesters */
export async function getSemesters(): Promise<Semester[]> {
    return apiFetch<Semester[]>('/semesters');
}

// ─── Estudiantes ─────────────────────────────────────────────────────

/**
 * Registra un estudiante individualmente via POST /api/students.
 * El backend espera campos en snake_case.
 */
export async function createStudent(payload: StudentPayload): Promise<BackendStudent> {
    return apiFetch<BackendStudent>('/students', {
        method: 'POST',
        body: JSON.stringify({
            nombre_completo:      payload.nombreCompleto.trim(),
            carnet_id:            payload.carnetId.trim(),
            correo_institucional: payload.correoInstitucional.trim(),
            semester_id:          payload.semesterId,
            fase_academica:       payload.faseAcademica,
            approved:             false,
        }),
    });
}

// ─── Tipos de respuesta del backend para historial ────────────────────

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
 * El backend valida cada fila y retorna el resumen con errores por fila.
 * semesterId es obligatorio para la inserción; si no se provee se usa el
 * valor de semestreLectivo de cada fila (fallback: string vacío → backend rechaza).
 */
export async function importStudents(
    rows: ParsedRow[],
    semesterId?: string,
): Promise<ImportResult> {
    // Construir payload para el backend
    const filas = rows.map((row) => ({
        nombre_completo:      (row.nombreCompleto ?? '').trim(),
        carnet_id:            (row.carnetId ?? '').trim(),
        correo_institucional: (row.correoInstitucional ?? '').trim(),
        fase_academica:       (row.faseAcademica ?? 'anteproyecto').trim(),
        semester_id:          semesterId ?? (row.semestreLectivo ?? '').trim(),
        approved:             false,
    }));

    const resp = await apiFetch<BulkResponse>('/students/bulk', {
        method: 'POST',
        body: JSON.stringify({ filas }),
    });

    // Normalizar respuesta del backend al formato ImportResult del frontend
    const result: ImportResult = {
        imported: resp.importados,
        rejected: resp.rechazados,
        errors:   resp.errores.map((e) => ({ row: e.fila, reason: e.razon })),
    };

    return result;
}

/** Sube un PDF (sin endpoint de backend — no genera historial en BD). */
export async function uploadPdf(_file: File): Promise<void> {
    // PDF processing is handled server-side when backend endpoint is added
}

/** Descarga la plantilla Excel de carga masiva desde el backend. */
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

/** Obtiene el historial de cargas recientes desde el backend. */
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
