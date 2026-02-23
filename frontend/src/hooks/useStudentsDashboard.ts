/**
 * useStudentsDashboard.ts
 *
 * Hook que encapsula la lógica de datos de estudiantes
 * usada en el panel de inicio del dashboard:
 *   - Carga de todos los estudiantes desde localStorage
 *   - Carga de estudiantes recientes
 *   - Cómputo de KPIs
 *   - Filtrado rápido (búsqueda + estado)
 *
 * Reutilizable entre DashboardPage y cualquier otro componente
 * que necesite acceso a los mismos datos de estudiantes.
 */

import { useEffect, useMemo, useState } from 'react';
import { getStudents, getRecentStudents, computeStudentKpis } from '../services/studentStore';
import type { Student } from '../types/student';

export function useStudentsDashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);

    // Filtros del panel de actividad reciente
    const [dashStudentQuery, setDashStudentQuery] = useState('');
    const [dashStatusFilter, setDashStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

    // ── Carga inicial ────────────────────────────────────────────────

    useEffect(() => {
        const all = getStudents();
        setStudents(all);
        setRecentStudents(getRecentStudents(5));
    }, []);

    // ── KPIs computados ─────────────────────────────────────────────

    const studentKpis = useMemo(() => computeStudentKpis(students), [students]);

    // ── Actividad reciente filtrada ──────────────────────────────────

    const filteredRecent = useMemo(() => {
        const q = dashStudentQuery.trim().toLowerCase();
        return recentStudents.filter((s) => {
            const matchText = !q ||
                s.nombreCompleto.toLowerCase().includes(q) ||
                s.carnetId.toLowerCase().includes(q);
            const matchStatus =
                dashStatusFilter === 'all' ||
                (dashStatusFilter === 'approved' && s.approved) ||
                (dashStatusFilter === 'pending' && !s.approved);
            return matchText && matchStatus;
        });
    }, [recentStudents, dashStudentQuery, dashStatusFilter]);

    return {
        students,
        recentStudents,
        studentKpis,
        filteredRecent,
        dashStudentQuery,
        setDashStudentQuery,
        dashStatusFilter,
        setDashStatusFilter,
    } as const;
}
