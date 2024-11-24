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

const signOut = () => {
    auth.signOut();
}
const UserDetails = ({ user, uOptions=false }) => {
    const { uid, displayName, photoURL } = user;
    return(
        <div className="user-details">
            <img src={photoURL}/>
            <p>{displayName}{user.uid === auth.currentUser.uid && uOptions===false ? " (You)" : ""} </p>
        </div>
    );
}
const Menu = ({chatID, setChatID, contacts, setContacts}) =>{
    
    useEffect(() => {
        const q = query(doc(db, "UserChats", auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if(!querySnapshot.exists()) return;
            const chats = Object.entries(querySnapshot.data())?.map(chat => {
                return chat[1].userInfo;
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
                <UserDetails user={auth.currentUser} uOptions={true}/>
                <button id="sign-out" className="btn btn-secondary btn-sm" onClick={signOut}>Sign Out</button>
            </div>
            <Search contacts={contacts} setContacts={setContacts} chatID={chatID} setChatID={setChatID} />
            {contacts ? contacts.map((contact) => {
                return(
                <div key={contact.uid} className="contact" onClick={() => setID(contact)}>
                    <UserDetails user={contact}/>
                </div>
            )}):<p>loading users</p>}
        </div>
    );
}
export { Menu, UserDetails };