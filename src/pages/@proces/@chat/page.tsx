// App.tsx (Ejemplo de uso)
import React, { useEffect, useState } from 'react';
import ChatComponent from './components/chat-component';
import { getLocalStorageItem } from '@/utils/functions/local-storage';

const Chat: React.FC = () => {
    // En una aplicación real, esto vendría de tu sistema de autenticación
    const [currentUser, setCurrentUser] = useState({
        id: 'user1',
        nombre: 'usuario1',
        telefono: '000-000-0000'
    });
    // En una aplicación real, tendrías múltiples chats
    const [activeChat, setActiveChat] = useState('general');
    useEffect(() => {
        const userData = getLocalStorageItem('user-data');
        const user = {
            id: userData.id || 'default-id',
            nombre: userData.nombre || 'Usuario',
            telefono: userData.telefono || '000-000-0000',
        };
        setActiveChat(`${userData.telefono}`)
        setCurrentUser(user)
    }, [])

    return (
        <section className="flex flex-col h-screen">
            <ChatComponent
                chatId={activeChat}
                currentUser={currentUser}
            />
        </section>
    );
};

export default Chat;