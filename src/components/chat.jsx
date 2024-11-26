import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp, getDocs, doc, setDoc, where, updateDoc } from "firebase/firestore";
import {
    query,
    orderBy,
    onSnapshot,
    limit,
  } from "firebase/firestore";
import {Menu, UserDetails} from "./menu";

const Chat = () => {
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
            await updateDoc(doc(db, "UserChats", auth.currentUser.uid), {
                [`${chatID}.userInfo.lastMessage`]: newMessage.text,
                [`${chatID}.timestamp`]: newMessage.createdAt
                    
            });
            await updateDoc(doc(db, "UserChats", Recipent().uid), {
                [`${chatID}.userInfo.lastMessage`]: newMessage.text,
                [`${chatID}.timestamp`]: newMessage.createdAt
            });
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
            console.log(sortedMessages);
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
                if (prevMessages.length === 0 || latestMessage && latestMessage.id !== prevMessages[prevMessages.length - 1].id){
                    return [...prevMessages, latestMessage];
                } else return prevMessages;
            });
            setNewMessagesCount((prevCount) => prevCount + 1);
        });
        return () => unsubscribe();
    }, [chatID]);

    useEffect(() => {
        if(messagesDivRef.current){
            if(isNearBottomRef.current || messages[messages.length - 1].uid === auth.currentUser.uid){
                scroll();
            }else{
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
            if(chatID.includes(contact.uid) && contact.uid !== auth.currentUser.uid){
                recipent = contact;
            } 
        })
        if (!recipent.uid && chatID) {
            recipent = auth.currentUser;
        }
        return recipent;
    }
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
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
        return `${hours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    }
    return (
        <div id="container">
            <Menu
            chatID={chatID}
            setChatID={setChatID}
            contacts={contacts}
            setContacts={setContacts}
            messageTime={messageTime}
             />
            <div id="chat-div">
                <div id="current-recipent">
                    <UserDetails user={Recipent()} />
                </div>
                <div id="messages-div" ref={messagesDivRef} onScroll={handleScroll}>
                    
                    {messages && messages.map((msg, index) => {
                        if (msg.uid === auth.currentUser.uid){
                            return (
                            <div key={index} className="sent-div">
                                <span className="time">{messageTime(msg.createdAt).replace(/:\d{2}\s/, ' ')}</span>
                                <p className="sent">{msg.text}</p>  
                            </div>
                            );
                        }else{
                            return (
                                <div key={msg.id} className="recieved-div">
                                    <p className="recieved">{msg.text}</p>
                                    <span className="time">{messageTime(msg.createdAt).replace(/:\d{2}\s/, ' ')}</span>
                                </div>
                                );
                        }       
                    })}                    
                    <div id="new-count" className={isNearBottom ? "fade-out" : ""}>
                        {newMessagesCount !== 0 && (<span>{newMessagesCount}</span>)}
                        <button onClick={scroll}><i className="fa fa-arrow-down"></i></button>
                    </div> 
                </div>
                {chatID ? (
                <div id="input-div">
                    <textarea placeholder="Enter a message..." type="text" value={message} onChange={handleInput} onKeyDown={handleEnter} ref={textareaRef} />
                    <button onClick={handleSend}>Send</button>
                </div>) : <p>select a chat</p>
                }
            </div>
        </div>
    );
}

export default Chat;