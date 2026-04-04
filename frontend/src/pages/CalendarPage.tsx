import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import AppShell from '../layout/AppShell';
import { getCalendarEvents, getCalendarDeadlines } from '../services/calendarService';
import type { CalendarEvent, CalendarDeadline } from '../services/calendarService';
import '../styles/calendar.css';
import '../styles/student-new.css';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function toDateKey(dateStr: string): string {
    const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function localKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildGrid(year: number, month: number): (Date | null)[] {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

function chipClass(tipo: string, isDeadline: boolean): string {
    if (isDeadline) return 'cal-chip--orange';
    switch (tipo.toLowerCase()) {
        case 'examen':                       return 'cal-chip--red';
        case 'defensa':
        case 'revision':
        case 'reunion':                      return 'cal-chip--blue';
        case 'entrega':                      return 'cal-chip--orange';
        default:                             return 'cal-chip--gray';
    }
}

interface DayItem { id: string; title: string; tipo: string; isDeadline: boolean; }

const CalendarPage: React.FC = () => {
    const today = new Date();
    const todayKey = localKey(today);

    const [events,    setEvents]    = useState<CalendarEvent[]>([]);
    const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [year,      setYear]      = useState(today.getFullYear());
    const [month,     setMonth]     = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        Promise.all([getCalendarEvents(), getCalendarDeadlines()])
            .then(([evts, dls]) => {
                if (canceled) return;
                setEvents(evts);
                setDeadlines(dls);
            })
            .catch(() => {})
            .finally(() => { if (!canceled) setLoading(false); });
        return () => { canceled = true; };
    }, []);

    const eventMap = useMemo(() => {
        const map = new Map<string, DayItem[]>();
        const push = (key: string, item: DayItem) => {
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        };
        events.forEach((ev) =>
            push(toDateKey(ev.fecha_inicio), { id: ev.id, title: ev.titulo, tipo: ev.tipo, isDeadline: false })
        );
        deadlines.forEach((dl) =>
            push(toDateKey(dl.fecha), { id: dl.id, title: dl.titulo, tipo: 'deadline', isDeadline: true })
        );
        return map;
    }, [events, deadlines]);

    const cells = useMemo(() => buildGrid(year, month), [year, month]);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
        setSelectedDay(null);
    };

    const selectedItems = selectedDay ? (eventMap.get(selectedDay) ?? []) : [];

    return (
        <AppShell>
            <div className="cal-body">
                {/* Breadcrumb */}
                <nav className="sn-breadcrumb" aria-label="Navegación secundaria">
                    <span className="sn-breadcrumb__item">Inicio</span>
                    <ChevronRight size={14} className="sn-breadcrumb__sep" />
                    <span className="sn-breadcrumb__item sn-breadcrumb__item--active">
                        Calendario Académico
                    </span>
                </nav>

                <div className="cal-page-header">
                    <h1 className="cal-page-title">Calendario Académico</h1>
                    <p className="cal-page-subtitle">Eventos y fechas límite del semestre</p>
                </div>

                {loading ? (
                    <div className="cal-loading">
                        <div className="cal-loading__spinner" aria-hidden="true" />
                        Cargando calendario…
                    </div>
                ) : (
                    <div className="cal-month-wrapper">

                        {/* Navigation */}
                        <div className="cal-nav">
                            <button className="cal-nav__btn" onClick={prevMonth} aria-label="Mes anterior">
                                <ChevronLeft size={18} />
                            </button>
                            <h2 className="cal-nav__title">{MONTHS_ES[month]} {year}</h2>
                            <button className="cal-nav__btn" onClick={nextMonth} aria-label="Mes siguiente">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="cal-legend">
                            <span className="cal-chip cal-chip--red">Exámenes</span>
                            <span className="cal-chip cal-chip--orange">Entregas</span>
                            <span className="cal-chip cal-chip--blue">Académico</span>
                            <span className="cal-chip cal-chip--gray">Otros</span>
                        </div>

                        {/* Month grid */}
                        <div className="cal-grid-month" role="grid" aria-label={`Calendario de ${MONTHS_ES[month]} ${year}`}>
                            {DAYS_SHORT.map((d) => (
                                <div key={d} className="cal-grid__dow" role="columnheader">{d}</div>
                            ))}

                            {cells.map((day, idx) => {
                                if (!day) return (
                                    <div key={`e-${idx}`} className="cal-cell cal-cell--empty" aria-hidden="true" />
                                );
                                const key = localKey(day);
                                const items = eventMap.get(key) ?? [];
                                const isToday    = key === todayKey;
                                const isSelected = key === selectedDay;
                                const cls = [
                                    'cal-cell',
                                    isToday    && 'cal-cell--today',
                                    isSelected && 'cal-cell--selected',
                                    items.length > 0 && 'cal-cell--has-events',
                                ].filter(Boolean).join(' ');

                                return (
                                    <div
                                        key={key}
                                        className={cls}
                                        onClick={() => setSelectedDay(isSelected ? null : key)}
                                        role="gridcell"
                                        tabIndex={0}
                                        aria-label={`${day.getDate()} de ${MONTHS_ES[month]}${items.length ? `, ${items.length} evento${items.length > 1 ? 's' : ''}` : ''}`}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedDay(isSelected ? null : key)}
                                    >
                                        <span className="cal-cell__num">{day.getDate()}</span>
                                        <div className="cal-cell__events">
                                            {items.slice(0, 2).map((it) => (
                                                <span
                                                    key={it.id}
                                                    className={`cal-chip cal-chip--sm ${chipClass(it.tipo, it.isDeadline)}`}
                                                    title={it.title}
                                                >
                                                    {it.title}
                                                </span>
                                            ))}
                                            {items.length > 2 && (
                                                <span className="cal-cell__more">+{items.length - 2} más</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day detail panel */}
                        {selectedDay && (
                            <div className="cal-day-panel" role="region" aria-label="Eventos del día seleccionado">
                                <div className="cal-day-panel__header">
                                    <h3 className="cal-day-panel__title">
                                        {(() => {
                                            const [y, m, d] = selectedDay.split('-').map(Number);
                                            return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
                                        })()}
                                    </h3>
                                    <button
                                        className="cal-day-panel__close"
                                        onClick={() => setSelectedDay(null)}
                                        aria-label="Cerrar panel"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {selectedItems.length === 0 ? (
                                    <p className="cal-day-panel__empty">Sin eventos registrados para este día.</p>
                                ) : (
                                    <ul className="cal-day-panel__list">
                                        {selectedItems.map((it) => (
                                            <li key={it.id} className="cal-day-panel__item">
                                                <span className={`cal-chip ${chipClass(it.tipo, it.isDeadline)}`}>
                                                    {it.isDeadline ? 'Entrega' : it.tipo}
                                                </span>
                                                <span className="cal-day-panel__item-title">{it.title}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default CalendarPage;
