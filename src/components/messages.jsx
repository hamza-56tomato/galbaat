import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp, getDocs, doc, updateDoc } from "firebase/firestore";
import {
    query,
    orderBy,
    onSnapshot,
    limit,
  } from "firebase/firestore";
import { formatDate, isSameDay } from "../date";
import { UserDetails } from "./menu";

export const Messages = ({chatID, setChatID, contacts, messageTime, isMobile, showChat}) =>{
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const isNearBottomRef = useRef(true);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const messagesDivRef = useRef(null);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const textareaRef = useRef(null);
    const lastMessageTimeRef = useRef(null);
    const handleInput = (event) => {
        setMessage(event.target.value);
        adjustTextareaHeight();
    }
    const handleSend = async () => {
        if(!chatID) return;
        if(message.trim() !== ""){
            const { uid, displayName, photoURL } = auth.currentUser;
            const newMessage = {
                text: message.trim(),
                name: displayName,
                avatar: photoURL,
                createdAt: new Date(),
                uid,
            };
            setMessage("");
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            await addDoc(collection(db, "Chats", chatID, "messages"), {
                ...newMessage,
                createdAt: serverTimestamp()
            });
            textareaRef.current.style.height = '2.5rem';

            // Update last message in UserChats
            const recipient = Recipent();
            if (recipient && recipient.uid) {
                await updateDoc(doc(db, "UserChats", auth.currentUser.uid), {
                    [`${chatID}.userInfo.lastMessage`]: newMessage.text,
                    [`${chatID}.timestamp`]: newMessage.createdAt
                 });
                await updateDoc(doc(db, "UserChats", recipient.uid), {
                    [`${chatID}.userInfo.lastMessage`]: newMessage.text,
                    [`${chatID}.timestamp`]: newMessage.createdAt
                });
            }
        }
    }
    const handleEnter = (event) =>{
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevents adding a new line
            handleSend(); // Send the message if only Enter is pressed
        }
    }
    const scroll = () => {
        messagesDivRef.current.scrollTop = messagesDivRef.current.scrollHeight;
    }
    const handleScroll = () => {
          const { scrollTop, scrollHeight, clientHeight } = messagesDivRef.current;
          // Check if the user is near the bottom (e.g., within 100px of the bottom)
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
          isNearBottomRef.current = isAtBottom;
          if(isAtBottom){
            setIsNearBottom(true);
            setNewMessagesCount(0);
          } else{
            setIsNearBottom(false);
          }     
    }

    //messages listener
    useEffect(() => {
        console.log('hhhhhhhhhhh');
        if (!chatID) return;
        const initialFetch = async () => {
            const initialQuery = query(
                collection(db, "Chats", chatID, "messages"),
                orderBy("createdAt", "desc"),
                limit(50)
            );
            const initialSnapshot = await getDocs(initialQuery);
            if(initialSnapshot.empty) {
                setMessages([]);
                return;
            }
            const fetchedMessages = initialSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            const sortedMessages = fetchedMessages.sort(
                (a, b) => a.createdAt - b.createdAt
            );
            setMessages(sortedMessages);
            if (sortedMessages.length > 0) lastMessageTimeRef.current = sortedMessages[sortedMessages.length - 1].createdAt;
        }
        initialFetch();
        const liveQuery = query(
            collection(db, "Chats", chatID, "messages"),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const unsubscribe = onSnapshot(liveQuery, (querySnapshot) => {
            if (!querySnapshot.docs[0]) return;
            let latestMessage = {...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id};
            if (latestMessage.uid === auth.currentUser.uid) return;
            setMessages((prevMessages) => {
                if ((prevMessages.length === 0) || (latestMessage && latestMessage.id !== prevMessages[prevMessages.length - 1].id)){
                    return [...prevMessages, latestMessage];
                } else return prevMessages;
            });
            setNewMessagesCount((prevCount) => prevCount + 1);
        });
        return () => unsubscribe();
    }, [chatID]);

    useEffect(() => {
        if(messagesDivRef.current){
            const lastMessage = messages[messages.length - 1];
            if(isNearBottomRef.current || (lastMessage && lastMessage.uid === auth.currentUser.uid)){
                scroll();
            } else {
                handleScroll();
            }
        }
    }, [messages]);   

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
        }
    }
    const Recipent = () => {
        let recipent = {};
        contacts.forEach((contact) => {
            if(contact.uid){
            if(chatID.includes(contact.uid) && contact.uid !== auth.currentUser.uid){
                recipent = contact;
            } }
        })
        if (!recipent.uid && chatID) {
            recipent = auth.currentUser;
        }
        return recipent;
    }
    return(
        <div id="chat-div" className={`${isMobile ? 'mobile-chat-div' : ''} ${isMobile && !showChat ? "hide" : ""}`}>
            <div id="current-recipent">
                {isMobile && 
                <button onClick={() => {setChatID(''); setMessages([])}}><i className="fa fa-arrow-left"></i></button>
                }
                <UserDetails user={Recipent()} />
            </div>
            <div id="messages-div" ref={messagesDivRef} onScroll={handleScroll}>
                
                {messages && messages.map((msg, index) => {
                    const previousMessage = messages[index - 1];
                    const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
                    const previousMsgDate = previousMessage?.createdAt?.toDate ? previousMessage.createdAt.toDate() : new Date(previousMessage?.createdAt);
                    // Check if both msgDate and previousMsgDate are valid Date objects before calling isSameDay
                    const isSameDayMessage = previousMessage && previousMsgDate instanceof Date && !isNaN(previousMsgDate)
                    ? isSameDay(msgDate, previousMsgDate)
                    : false;
                    if (msg.uid === auth.currentUser.uid) {
                        return (
                            <div key={index}>
                                {!isSameDayMessage && <p className="date">{formatDate(msgDate)}</p>}
                                <div className="sent-div">
                                    <span className="time">{messageTime(msg.createdAt).replace(/:\d{2}\s/, ' ')}</span>
                                    <p className={`sent ${isMobile ? 'mobile-msg' : ''}`}>{msg.text}</p>
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={index}>
                                {!isSameDayMessage && <p className="date">{formatDate(msgDate)}</p>}
                                <div className="recieved-div">
                                    <p className={`recieved ${isMobile ? 'mobile-msg' : ''}`}>{msg.text}</p>
                                    <span className="time">{messageTime(msg.createdAt).replace(/:\d{2}\s/, ' ')}</span>
                                </div>
                            </div>
                        );
                    }
                })}                    
                <div id="new-count" className={`${isNearBottom ? "fade-out" : ""} ${isMobile ? "mobile-new-count" : ""}`}>
                    {newMessagesCount !== 0 && (<span>{newMessagesCount}</span>)}
                    <button onClick={scroll}><i className="fa fa-arrow-down"></i></button>
                </div>
            </div>
            {chatID ? (
            <div id="input-div" className={isMobile ? 'px-1' : ''}>
                <textarea placeholder="Enter a message..." type="text" value={message} onChange={handleInput}
                 onKeyDown={handleEnter} ref={textareaRef} className={isMobile ? "mobile-text-area" : ''} />
                <button onClick={handleSend} className={isMobile ? 'w-15' : 'w-7'}>Send</button>
            </div>) : <p className="no-chat-text">select a chat</p>
            }
        </div>
    );
}