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

// ─── Persistencia en localStorage ────────────────────────────────────
//
// Antes se usaba una variable de módulo (`let _recentUploads`), lo cual
// provocaba que el historial de cargas se perdiera al recargar la página.
// Ahora se usa localStorage con el mismo patrón de seed de `student.ts`.

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

/** Lee las cargas recientes desde localStorage. Carga datos semilla si no existe. */
function readUploads(): UploadItem[] {
    try {
        const raw = localStorage.getItem(UPLOADS_KEY);
        if (raw) return JSON.parse(raw) as UploadItem[];
    } catch {
        // JSON corrupto → reinicializar
    }
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(SEED_UPLOADS));
    return SEED_UPLOADS;
}

/** Guarda las cargas recientes en localStorage (máx. 10 ítems). */
function saveUploads(uploads: UploadItem[]): void {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploads.slice(0, 10)));
}

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

    // Persistir nueva carga en historial
    const current = readUploads();
    saveUploads([
        {
            id: `ul-${Date.now()}`,
            filename: `importacion_${new Date().toISOString().slice(0, 10)}.xlsx`,
            status: (rejected === rows.length ? 'error' : 'success') as UploadItem['status'],
            uploadedAt: 'Ahora',
            type: 'excel',
        },
        ...current,
    ]);

    return { imported, rejected, errors };
}

/**
 * Sube un PDF al servidor.
 * Equivalente a POST /api/students/upload-pdf
 */
export async function uploadPdf(file: File): Promise<void> {
    await delay(500);
    // TODO: const fd = new FormData(); fd.append('file', file); await fetch('/api/students/upload-pdf', { method: 'POST', body: fd });

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

/**
 * Obtiene las cargas recientes.
 * Equivalente a GET /api/students/uploads
 */
export async function getRecentUploads(): Promise<UploadItem[]> {
    await delay(300);
    // TODO: return await fetch('/api/students/uploads').then(r => r.json());
    return readUploads();
}
