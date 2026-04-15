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
    recordatorio: boolean;
    recordatorio_tiempo: number;
}

export interface CalendarDeadline {
    id: string;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    fase_academica: string | null;
}

export interface EventPayload {
    titulo: string;
    tipo: string;
    fecha_inicio: string;
    fecha_fin?: string | null;
    ubicacion?: string | null;
    descripcion?: string | null;
    recordatorio?: boolean;
    recordatorio_tiempo?: number;
}

export function getCalendarEvents(): Promise<CalendarEvent[]> {
    return apiFetch<CalendarEvent[]>('/events');
}

export function getCalendarDeadlines(): Promise<CalendarDeadline[]> {
    return apiFetch<CalendarDeadline[]>('/deadlines');
}

export function createEvent(data: EventPayload): Promise<CalendarEvent> {
    return apiFetch<CalendarEvent>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateEvent(id: string, data: Partial<EventPayload>): Promise<CalendarEvent> {
    return apiFetch<CalendarEvent>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteEvent(id: string): Promise<void> {
    return apiFetch<void>(`/events/${id}`, { method: 'DELETE' });
}

export function deleteDeadline(id: string): Promise<void> {
    return apiFetch<void>(`/deadlines/${id}`, { method: 'DELETE' });
}
