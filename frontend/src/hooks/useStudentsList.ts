/**
 * useStudentsList.ts
 *
 * Hook que encapsula toda la lógica de la página /students:
 *   - Carga de estudiantes desde studentStore
 *   - KPIs computados
 *   - Búsqueda + filtro por estado
 *   - Optimistic UI para el toggle de aprobación,
 *     con cleanup de setTimeout para evitar memory leaks
 *     si el componente se desmonta antes de resolverse.
 *
 * DashboardPage puede importar solo useStudentsDashboard;
 * este hook es específico de StudentsListPage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getStudents,
    updateStudentStatus,
    computeStudentKpis,
} from '../services/studentStore';
import type { Student } from '../types/student';

export type StatusFilter = 'all' | 'approved' | 'pending';

export function useStudentsList() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    // Tracks in-progress toggles to disable the control during the async delay
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    // Ref to collect pending timeoutIds for cleanup on unmount
    const pendingTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    // ── Carga inicial ────────────────────────────────────────────────

    useEffect(() => {
        const data = getStudents();
        setStudents(data);
        setLoading(false);

        // Cleanup: cancel any pending timers when unmounting
        const timers = pendingTimers.current;
        return () => {
            timers.forEach((id) => clearTimeout(id));
            timers.clear();
        };
    }, []);

    // ── Toggle de aprobación (Optimistic UI) ─────────────────────────

    const handleToggle = useCallback((id: string, next: boolean) => {
        // 1. Actualización optimista inmediata en UI
        setStudents((prev) =>
            prev.map((s) =>
                s.id === id ? { ...s, approved: next, updatedAt: new Date().toISOString() } : s,
            ),
        );
        setToggling((t) => ({ ...t, [id]: true }));

        // 2. Persistir tras delay simulado (reemplazar con fetch PATCH en API real)
        // TODO API real:
        // fetch(`/api/students/${id}/status`, {
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ approved: next }),
        // }).catch(() => {
        //   // Rollback en caso de error
        //   setStudents((prev) => prev.map((s) => s.id === id ? { ...s, approved: !next } : s));
        // });
        const tid = setTimeout(() => {
            updateStudentStatus(id, next);
            setToggling((t) => ({ ...t, [id]: false }));
            pendingTimers.current.delete(tid);
        }, 300);

        pendingTimers.current.add(tid);
    }, []);

    // ── KPIs ─────────────────────────────────────────────────────────

    const kpis = useMemo(() => computeStudentKpis(students), [students]);

    // ── Filtrado ─────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return students.filter((s) => {
            const matchText =
                !q ||
                s.nombreCompleto.toLowerCase().includes(q) ||
                s.carnetId.toLowerCase().includes(q) ||
                s.correoInstitucional.toLowerCase().includes(q);
            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'approved' && s.approved) ||
                (statusFilter === 'pending' && !s.approved);
            return matchText && matchStatus;
        });
    }, [students, query, statusFilter]);

    return {
        students,
        loading,
        query,
        setQuery,
        statusFilter,
        setStatusFilter,
        toggling,
        handleToggle,
        kpis,
        filtered,
    } as const;
}
