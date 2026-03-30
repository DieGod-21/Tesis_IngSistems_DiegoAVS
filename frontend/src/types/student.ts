/**
 * student.ts
 *
 * Interfaz canónica del estudiante.
 *
 * NOTA DE ARQUITECTURA:
 * Este archivo SOLO define el modelo de dominio (interfaz).
 * La persistencia (localStorage / API) vive en services/studentStore.ts.
 * Esto respeta la separación de capas: el dominio no conoce la infraestructura.
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

