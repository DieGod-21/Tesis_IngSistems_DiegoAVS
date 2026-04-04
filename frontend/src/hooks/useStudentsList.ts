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
import { useToast } from '../context/ToastContext';

export type StatusFilter = 'all' | 'approved' | 'pending';

export function useStudentsList(initialQuery = '') {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState(initialQuery);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const isMountedRef = useRef(true);
    const { toast } = useToast();

    // ── Carga inicial (async) ─────────────────────────────────────────

    useEffect(() => {
        let canceled = false;

        const load = async () => {
            try {
                const data = await getStudents();
                if (!canceled) setStudents(data);
            } catch {
                // API error: la tabla queda vacía, no hay crash
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        load();
        return () => {
            canceled = true;
            isMountedRef.current = false;
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

        // 2. Persistir via API (async) con UI optimista.
        updateStudentStatus(id, next)
            .then(() => {
                if (isMountedRef.current) {
                    toast.success(next ? 'Estudiante aprobado correctamente' : 'Aprobación revertida');
                }
            })
            .catch(() => {
                if (isMountedRef.current) {
                    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, approved: !next } : s));
                    toast.error('No se pudo actualizar el estado. Intenta de nuevo.');
                }
            });
    }, []);

    // ── KPIs ─────────────────────────────────────────────────────────

    const kpis = useMemo(() => computeStudentKpis(students), [students]);

    // ── Filtrado ─────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const normalize = (str: string) =>
            str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const q = normalize(query.trim());
        return students.filter((s) => {
            const matchText =
                !q ||
                normalize(s.nombreCompleto).includes(q) ||
                normalize(s.carnetId).includes(q) ||
                normalize(s.correoInstitucional).includes(q);
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
        handleToggle,
        kpis,
        filtered,
    } as const;
}
