import { apiFetch } from './apiClient';

export interface CalendarEvent {
    id: string;
    titulo: string;
    tipo: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    ubicacion: string | null;
    descripcion: string | null;
    fase_academica: string | null;
}

export interface CalendarDeadline {
    id: string;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    fase_academica: string | null;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    return apiFetch<CalendarEvent[]>('/events');
}

export async function getCalendarDeadlines(): Promise<CalendarDeadline[]> {
    return apiFetch<CalendarDeadline[]>('/deadlines');
}
