/**
 * student.ts
 *
 * Interfaz canónica del estudiante.
 *
 * NOTA DE ARQUITECTURA:
 * Este archivo SOLO define el modelo de dominio (interfaz).
 * La persistencia (localStorage / API) vive en services/studentStore.ts.
 * Esto respeta la separación de capas: el dominio no conoce la infraestructura.
 *
 * Re-exporta las funciones de studentStore para mantener compatibilidad
 * con los imports existentes durante la transición.
 */

// ─── Interfaz de dominio ─────────────────────────────────────────────

export interface Student {
    id: string;
    nombreCompleto: string;
    carnetId: string;
    correoInstitucional: string;
    semestreLectivo: string;
    faseAcademica: 'PG1' | 'PG2';
    approved: boolean;          // false = Pendiente, true = Aprobado
    createdAt: string;          // ISO 8601
    updatedAt: string;          // ISO 8601
}

// ─── Re-exports de compatibilidad ────────────────────────────────────
// Permite que los archivos que importan desde '../types/student'
// sigan funcionando sin cambios inmediatos.

export {
    getStudents,
    saveStudents,
    updateStudentStatus,
    addStudent,
    computeStudentKpis,
    getRecentStudents,
} from '../services/studentStore';

