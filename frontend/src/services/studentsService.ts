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

// ─── Uploads (historial local — no tiene endpoint en backend) ─────────

const UPLOADS_KEY = 'umg_recent_uploads';

const SEED_UPLOADS: UploadItem[] = [
    {
        id: 'ul-1',
        filename: 'estudiantes_pg1_v2.xlsx',
        status: 'success',
        uploadedAt: 'Hace 2 horas',
        type: 'excel',
    },
    {
        id: 'ul-2',
        filename: 'listado_final_sedes.pdf',
        status: 'success',
        uploadedAt: 'Ayer',
        type: 'pdf',
    },
];

function readUploads(): UploadItem[] {
    try {
        const raw = localStorage.getItem(UPLOADS_KEY);
        if (raw) return JSON.parse(raw) as UploadItem[];
    } catch { /* JSON corrupto */ }
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(SEED_UPLOADS));
    return SEED_UPLOADS;
}

function saveUploads(uploads: UploadItem[]): void {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploads.slice(0, 10)));
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

    // Registrar en historial local
    const current = readUploads();
    saveUploads([
        {
            id: `ul-${Date.now()}`,
            filename: `importacion_${new Date().toISOString().slice(0, 10)}.xlsx`,
            status: (resp.rechazados === rows.length ? 'error' : 'success') as UploadItem['status'],
            uploadedAt: 'Ahora',
            type: 'excel',
        },
        ...current,
    ]);

    return result;
}

/** Sube un PDF (historial local, sin endpoint de backend aún). */
export async function uploadPdf(file: File): Promise<void> {
    const current = readUploads();
    saveUploads([
        {
            id: `ul-${Date.now()}`,
            filename: file.name,
            status: 'success',
            uploadedAt: 'Ahora',
            type: 'pdf',
        },
        ...current,
    ]);
}

/** Obtiene el historial de cargas recientes. */
export async function getRecentUploads(): Promise<UploadItem[]> {
    return readUploads();
}
