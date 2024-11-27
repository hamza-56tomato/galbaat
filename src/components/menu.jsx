import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp, getDocs, doc, setDoc, where } from "firebase/firestore";
import {
    query,
    orderBy,
    onSnapshot,
    limit,
  } from "firebase/firestore";
import Search from "./search";
import { formatDate, isSameDay } from "../date";
const signOut = () => {
    auth.signOut();
}
const UserDetails = ({ user, uOptions=false, lastMessage="", time="" }) => {
    const { uid, displayName, photoURL } = user;
    time = time.replace(/:\d{2}\s/, ' ');
    if(lastMessage && lastMessage.length > 20){
        lastMessage = lastMessage.substring(0, 20) + "...";
    }
    return(
        <div className="user-details">
            <div className="contact-info">
                <img src={photoURL}/>
                <div>
                <p>{displayName}{user.uid === auth.currentUser.uid && uOptions===false ? " (You)" : ""} </p>
                {lastMessage && 
                <p className="last-message">{lastMessage}</p>
                }
                </div>
            </div>
            <p className="contact-time">{time}</p>
        </div>

    );
}
const Menu = ({chatID, setChatID, contacts, setContacts, messageTime}) =>{
    
    useEffect(() => {
        const q = query(doc(db, "UserChats", auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if(!querySnapshot.exists()) return;
            let chats = Object.entries(querySnapshot.data())?.map(chat => {
                return {...chat[1].userInfo, timeSent: chat[1].timestamp};
            });
            chats.sort((a, b) => {
                if (a.timeSent === b.timeSent) return a.uid.localeCompare(b.uid);
                return a.timeSent < b.timeSent ? 1 : -1
            });
            setContacts(chats);
        });
        return () => unsubscribe();
    }, []);
    const setID = (contact) => {
        const newChatID = auth.currentUser.uid > contact.uid ? auth.currentUser.uid + "_" + contact.uid 
        : contact.uid + "_" + auth.currentUser.uid; 
        setChatID(newChatID);
    }
    
    return (
        <div id="menu">
            <div id="user-options">
                <UserDetails user={auth.currentUser} uOptions={true} />
                <button id="sign-out" className="btn btn-secondary btn-sm" onClick={signOut}>Sign Out</button>
            </div>
            <Search contacts={contacts} setContacts={setContacts} chatID={chatID} setChatID={setChatID} />
            <div id="contacts">
                {contacts ? contacts.map((contact) => {
                    let time = contact.timeSent !== '' ? formatDate(new Date(contact.timeSent.toDate())) : '';
                    if (time === 'Today') time = messageTime(contact.timeSent);
                    return(
                    <div key={contact.uid} className="contact" onClick={() => setID(contact)}>
                        <UserDetails user={contact} lastMessage={contact.lastMessage} time={time.toString()} />
                    </div>
                )}):<p>loading users</p>}
            </div>
        </div>
    );
}
export { Menu, UserDetails };