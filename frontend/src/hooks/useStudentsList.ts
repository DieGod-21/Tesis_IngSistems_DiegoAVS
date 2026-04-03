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

export function useStudentsList() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    // Tracks in-progress toggles to disable the control during the async operation
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    // Evita setState en componente desmontado (Promise puede resolver tarde)
    const isMountedRef = useRef(true);
    const { toast } = useToast();

    // ── Carga inicial (async) ─────────────────────────────────────────

    useEffect(() => {
        let canceled = false;

        const load = async () => {
            const data = await getStudents();
            if (!canceled) {
                setStudents(data);
                setLoading(false);
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
        setToggling((t) => ({ ...t, [id]: true }));

        // 2. Persistir via API (async) con UI optimista.
        updateStudentStatus(id, next)
            .then((updated) => {
                // Sincronizar con la lista fresca del servidor
                if (isMountedRef.current) {
                    setStudents(updated);
                    toast.success(next ? 'Estudiante aprobado correctamente' : 'Aprobación revertida');
                }
            })
            .catch(() => {
                // Rollback solo si el componente sigue montado
                if (isMountedRef.current) {
                    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, approved: !next } : s));
                    toast.error('No se pudo actualizar el estado. Intenta de nuevo.');
                }
            })
            .finally(() => {
                if (isMountedRef.current) {
                    setToggling((t) => ({ ...t, [id]: false }));
                }
            });
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
