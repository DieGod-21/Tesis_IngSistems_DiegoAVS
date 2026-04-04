/**
 * studentStore.ts
 *
 * Capa de acceso a datos de estudiantes.
 * Consume GET/PUT /api/students con JWT automático vía apiFetch.
 */

import { apiFetch } from './apiClient';
import type { Student, BackendStudent } from '../types/student';
import { mapBackendStudent } from '../types/student';

// ─── Lectura ─────────────────────────────────────────────────────────

/** Obtiene todos los estudiantes desde el backend. */
export async function getStudents(): Promise<Student[]> {
    const rows = await apiFetch<BackendStudent[]>('/students');
    return rows.map(mapBackendStudent);
}

/** Retorna los últimos N estudiantes por fecha de actualización. */
export async function getRecentStudents(n = 5): Promise<Student[]> {
    const all = await getStudents();
    return [...all]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, n);
}

// ─── Escritura ────────────────────────────────────────────────────────

/**
 * Actualiza el campo `approved` de un estudiante vía PUT /api/students/:id.
 * La UI ya aplica el cambio optimistamente — no se re-fetcha la lista completa.
 */
export async function updateStudentStatus(id: string, approved: boolean): Promise<void> {
    await apiFetch<BackendStudent>(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ approved }),
    });
}

// ─── KPIs ─────────────────────────────────────────────────────────────

/** Computa KPIs a partir de la lista de estudiantes. */
export function computeStudentKpis(students: Student[]) {
    const total    = students.length;
    const approved = students.filter((s) => s.approved).length;
    const pending  = total - approved;

    // Agrupar por academicPhaseId (clave estable) — evita duplicados si se renombra una fase.
    const byFase = students.reduce<Record<string, number>>((acc, s) => {
        const key = s.academicPhaseId != null ? String(s.academicPhaseId) : (s.phaseName ?? '—');
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    return { total, approved, pending, byFase };
}

