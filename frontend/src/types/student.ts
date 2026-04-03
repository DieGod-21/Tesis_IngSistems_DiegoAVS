/**
 * student.ts
 *
 * Interfaz canónica del estudiante (modelo de dominio).
 * También expone el tipo de respuesta del backend y un mapper.
 */

// ─── Modelo de dominio (camelCase, usado en toda la UI) ──────────────

export type FaseAcademica = 'anteproyecto' | 'tesis' | 'eps';

export interface Student {
    id: string;
    nombreCompleto: string;
    carnetId: string;
    correoInstitucional: string;
    /** Nombre legible del semestre (ej. "Primer Semestre 2025") */
    semestreLectivo: string;
    /** UUID del semestre en la base de datos */
    semesterId: string;
    faseAcademica: FaseAcademica;
    approved: boolean;
    createdAt: string;  // ISO 8601
    updatedAt: string;  // ISO 8601
}

// ─── Respuesta directa del API (snake_case) ──────────────────────────

export interface BackendStudent {
    id: string;
    nombre_completo: string;
    carnet_id: string;
    correo_institucional: string;
    fase_academica: string;
    semester_id: string;
    approved: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    /** Nombre del semestre (JOIN con semesters) */
    semestre: string | null;
}

// ─── Mapper ──────────────────────────────────────────────────────────

export function mapBackendStudent(s: BackendStudent): Student {
    return {
        id:                   s.id,
        nombreCompleto:       s.nombre_completo,
        carnetId:             s.carnet_id,
        correoInstitucional:  s.correo_institucional,
        semestreLectivo:      s.semestre ?? s.semester_id,
        semesterId:           s.semester_id,
        faseAcademica:        s.fase_academica as FaseAcademica,
        approved:             s.approved,
        createdAt:            s.created_at,
        updatedAt:            s.updated_at,
    };
}
