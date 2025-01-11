import { useState, useEffect } from "react";

import {Menu} from "./menu";

import { Settings } from "./settings";
import { Messages } from "./messages";
const Chat = () => {
    const [chatID, setChatID] = useState('');
    const [contacts, setContacts] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || "linear-gradient(pink, #ff6ec7)";
    });
    
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);
    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isMobileDevice = /mobile|android|iphone|ipad|tablet/.test(userAgent);
        setIsMobile(isMobileDevice);
    }, []);
    useEffect(() => {
        if(!isMobile) return;
        if (chatID === '') {
            setShowChat(false);
        } else {
            setShowChat(true);
        }
    }, [chatID]);
    const messageTime = (createdAt) => {
        // Check if createdAt is a Firestore Timestamp object
        if (createdAt === '') return '';
        if (createdAt && createdAt.toDate) {
            createdAt = createdAt.toDate();
        }
    
        // Check if createdAt is now a Date object
        if (!(createdAt instanceof Date)) {
            createdAt = new Date();
        }
    
        let hours = createdAt.getHours();
        const minutes = createdAt.getMinutes();
        const seconds = createdAt.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
        return `${hours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    }
    return (
        <div id="container" style={{background: theme}}>
            <Settings theme={theme} setTheme={setTheme} isMobile={isMobile} showChat={showChat} />
            <Menu
            chatID={chatID}
            setChatID={setChatID}
            contacts={contacts}
            setContacts={setContacts}
            messageTime={messageTime}
            isMobile={isMobile}
            showChat={showChat}
            setShowChat={setShowChat}
            />
            <Messages 
            chatID={chatID}
            setChatID={setChatID}
            contacts={contacts} 
            messageTime={messageTime} 
            isMobile={isMobile} 
            showChat={showChat} 
            />
        </div>
    );
}

export default Chat;