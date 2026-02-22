/**
 * AppShell.tsx
 *
 * Wrapper de layout compartido para todas las páginas autenticadas.
 * Gestiona el estado de apertura del sidebar (toggle en móvil)
 * y compone: IonPage > IonContent > dash-layout > Sidebar + dash-main.
 *
 * Props:
 *   children  — contenido de la página (div.dash-body u otro)
 *   onSearch  — callback opcional que pasa al TopHeader
 */

import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

interface AppShellProps {
    children: React.ReactNode;
    onSearch?: (query: string) => void;
}

const AppShell: React.FC<AppShellProps> = ({ children, onSearch }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <IonPage>
            <IonContent scrollY={true} fullscreen>
                <div className="dash-layout">
                    <Sidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    <div className="dash-main">
                        <TopHeader
                            onMenuToggle={() => setSidebarOpen((v) => !v)}
                            onSearch={onSearch}
                        />
                        {children}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AppShell;
