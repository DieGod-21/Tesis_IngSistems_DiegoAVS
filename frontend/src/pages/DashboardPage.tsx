import React from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardPage.tsx
 *
 * Página placeholder del panel principal.
 * DECISIÓN: Es deliberadamente simple en esta etapa.
 * Se expande cuando se implementen los módulos de PG1/PG2.
 */

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Gestión PG1-PG2</IonTitle>
                    <IonButton slot="end" fill="clear" color="light" onClick={handleLogout}>
                        Cerrar sesión
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <h1>Bienvenido, {user?.name ?? 'Usuario'}</h1>
                <p>
                    Esta es la página principal del sistema de gestión de trabajos de
                    graduación PG1-PG2 de la Universidad Mariano Gálvez de Guatemala.
                </p>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Módulos en construcción…
                </p>
            </IonContent>
        </IonPage>
    );
};

export default DashboardPage;
