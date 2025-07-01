// App.tsx (Ejemplo de uso)
import React, { useState } from 'react';
import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import ChatComponent from './components/chat-component';

const Chat: React.FC = () => {
    // En una aplicación real, esto vendría de tu sistema de autenticación
    const [currentUser] = useState({
        id: 'user1',
        name: 'Ana García',
        email: 'ana@example.com'
    });

    // En una aplicación real, tendrías múltiples chats
    const [activeChat] = useState('general');

    return (
        <IonReactRouter>
            <IonSplitPane contentId="main">
                <IonRouterOutlet id="main">
                    <Route exact path="/">
                        <Redirect to={`/chat/${activeChat}`} />
                    </Route>
                    <Route path="/chat/:chatId">
                        <ChatComponent
                            chatId={activeChat}
                            currentUser={currentUser}
                        />
                    </Route>
                </IonRouterOutlet>
            </IonSplitPane>
        </IonReactRouter>
    );
};

export default Chat;