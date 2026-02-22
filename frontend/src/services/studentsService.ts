/**
 * studentsService.ts
 *
 * Servicio de datos para la vista Registro de Estudiantes.
 * Todas las funciones son async con delay 500ms simulado.
 * Para conectar al API real: reemplazar cuerpos con fetch/axios,
 * manteniendo las mismas interfaces y firmas.
 */

// ─── Interfaces ────────────────────────────────────────────────────

/** Dominios válidos para correo institucional */
export const ALLOWED_EMAIL_DOMAINS = ['@miumg.edu.gt', '@umg.edu.gt'];

export interface StudentPayload {
    nombreCompleto: string;
    carnetId: string;
    correoInstitucional: string;
    semestreLectivo: string;
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

/** Ítem de carga reciente */
export interface UploadItem {
    id: string;
    filename: string;
    status: 'success' | 'error' | 'pending';
    uploadedAt: string; // texto relativo: "Hace 2 horas"
    type: 'excel' | 'pdf';
}

// ─── Helpers ────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEmail(email: string): boolean {
    const lower = email.toLowerCase();
    return ALLOWED_EMAIL_DOMAINS.some((d) => lower.endsWith(d));
}

// ─── Estado local mock (simula DB del servidor) ─────────────────────

let _recentUploads: UploadItem[] = [
    {
        id: 'ul-1',
        filename: 'estudiantes_pg1_v2.xlsx',
        status: 'success' as const,
        uploadedAt: 'Hace 2 horas',
        type: 'excel' as const,
    },
    {
        id: 'ul-2',
        filename: 'listado_final_sedes.pdf',
        status: 'success' as const,
        uploadedAt: 'Ayer',
        type: 'pdf' as const,
    },
];

// ─── API pública ────────────────────────────────────────────────────

/**
 * Registra un estudiante individualmente.
 * Equivalente a POST /api/students
 */
export async function createStudent(payload: StudentPayload): Promise<void> {
    await delay(500);
    // TODO: await fetch('/api/students', { method: 'POST', body: JSON.stringify(payload) });
    console.info('[studentsService] createStudent', payload);
}

/**
 * Importa una lista de filas parseadas de Excel/CSV.
 * Equivalente a POST /api/students/import
 */
export async function importStudents(
    rows: ParsedRow[],
): Promise<ImportResult> {
    await delay(500);
    // TODO: await fetch('/api/students/import', { method: 'POST', body: JSON.stringify({ rows }) });
    const errors: ImportResult['errors'] = [];
    let rejected = 0;

    rows.forEach((row) => {
        if (!row.carnetId?.trim()) {
            errors.push({ row: row.rowIndex, reason: 'Carnet vacío' });
            rejected++;
        } else if (row.correoInstitucional && !isValidEmail(row.correoInstitucional)) {
            errors.push({
                row: row.rowIndex,
                reason: `Correo inválido: ${row.correoInstitucional}`,
            });
            rejected++;
        }
    });

    const imported = rows.length - rejected;

    // Registrar en historial mock
    _recentUploads = [
        {
            id: `ul-${Date.now()}`,
            filename: `importacion_${new Date().toISOString().slice(0, 10)}.xlsx`,
            status: (rejected === rows.length ? 'error' : 'success') as UploadItem['status'],
            uploadedAt: 'Ahora',
            type: 'excel' as const,
        },
        ..._recentUploads,
    ].slice(0, 10);

    return { imported, rejected, errors };
}

/**
 * Sube un PDF al servidor.
 * Equivalente a POST /api/students/upload-pdf
 */
export async function uploadPdf(file: File): Promise<void> {
    await delay(500);
    // TODO: const fd = new FormData(); fd.append('file', file); await fetch('/api/students/upload-pdf', { method: 'POST', body: fd });

    _recentUploads = [
        {
            id: `ul-${Date.now()}`,
            filename: file.name,
            status: 'success' as const,
            uploadedAt: 'Ahora',
            type: 'pdf' as const,
        },
        ..._recentUploads,
    ].slice(0, 10);
}

/**
 * Obtiene las cargas recientes.
 * Equivalente a GET /api/students/uploads
 */
export async function getRecentUploads(): Promise<UploadItem[]> {
    await delay(300);
    // TODO: return await fetch('/api/students/uploads').then(r => r.json());
    return _recentUploads;
}
