import React, { createContext, useState, useRef } from 'react';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const isNearBottomRef = useRef(true);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const messagesDivRef = useRef(null);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const textareaRef = useRef(null);
    const [chatID, setChatID] = useState('');
    const [contacts, setContacts] = useState([]);
    const lastMessageTimeRef = useRef(null);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        isNearBottom,
        setIsNearBottom,
        newMessagesCount,
        setNewMessagesCount,
        chatID,
        setChatID,
        messagesDivRef,
        message,
        setMessage,
        textareaRef,
        contacts,
        setContacts,
        isNearBottomRef,
        lastMessageTimeRef
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}