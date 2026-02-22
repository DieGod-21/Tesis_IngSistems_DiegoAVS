/**
 * RecentUploads.tsx
 *
 * Lista de cargas recientes. Llama getRecentUploads() del servicio.
 * Acepta prop `refreshKey` (number) — incrementarlo desde el padre
 * provoca una re-carga de datos (patrón sin estado compartido global).
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, FileSpreadsheet, FileText } from 'lucide-react';
import { getRecentUploads } from '../../services/studentsService';
import type { UploadItem } from '../../services/studentsService';

interface RecentUploadsProps {
    refreshKey?: number;
}

const StatusIcon: React.FC<{ status: UploadItem['status'] }> = ({ status }) => {
    if (status === 'success') return <CheckCircle size={14} className="sn-upload__status-icon sn-upload__status-icon--success" />;
    if (status === 'error') return <XCircle size={14} className="sn-upload__status-icon sn-upload__status-icon--error" />;
    return <Clock size={14} className="sn-upload__status-icon sn-upload__status-icon--pending" />;
};

const TypeIcon: React.FC<{ type: UploadItem['type'] }> = ({ type }) =>
    type === 'excel'
        ? <FileSpreadsheet size={14} className="sn-upload__type-icon" />
        : <FileText size={14} className="sn-upload__type-icon" />;

const RecentUploads: React.FC<RecentUploadsProps> = ({ refreshKey = 0 }) => {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let canceled = false;
        setLoading(true);
        getRecentUploads().then((data) => {
            if (!canceled) {
                setUploads(data);
                setLoading(false);
            }
        });
        return () => { canceled = true; };
    }, [refreshKey]);

    return (
        <div className="sn-uploads">
            <p className="sn-uploads__title">Últimas Cargas</p>
            {loading ? (
                <div className="sn-uploads__loading">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="skeleton skeleton--line skeleton--medium sn-uploads__skeleton" />
                    ))}
                </div>
            ) : uploads.length === 0 ? (
                <p className="sn-uploads__empty">Sin cargas recientes.</p>
            ) : (
                <ul className="sn-uploads__list">
                    {uploads.map((item) => (
                        <li key={item.id} className="sn-upload__item">
                            <div className="sn-upload__left">
                                <StatusIcon status={item.status} />
                                <TypeIcon type={item.type} />
                                <span className="sn-upload__name" title={item.filename}>
                                    {item.filename}
                                </span>
                            </div>
                            <span className="sn-upload__time">{item.uploadedAt}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentUploads;
