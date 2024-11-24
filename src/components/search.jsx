import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp, getDocs, getDoc, doc, setDoc, where, updateDoc } from "firebase/firestore";
import {useState, useEffect} from "react";
import { UserDetails } from "./menu";

const Search = ({contacts, setContacts, chatID, setChatID}) => {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const snapshot = await getDocs(collection(db, "users"));
            const users = snapshot.docs.map(doc => doc.data());
            setAllUsers(users);
        };
        fetchUsers();
    }, []);

    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevents adding a new line
            handleSearch();
        }
    }

    const handleInput = (event) => {
        setSearch(event.target.value);
    }

    const handleSearch = () => {
        if (search.trim() !== "") {
            const results = allUsers.filter(user => 
                user.displayName.toLowerCase().includes(search.toLowerCase())
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
        setSearch('');
    }

    const createChat = async (user) => {
        const newChatID = auth.currentUser.uid > user.uid ? auth.currentUser.uid + "_" + user.uid 
        : user.uid + "_" + auth.currentUser.uid;

        const chat = await getDoc(doc(db, "Chats", newChatID));
        if(!chat.exists()){
            await setDoc(doc(db, "Chats", newChatID), {});
            await updateDoc(doc(db, "UserChats", auth.currentUser.uid), {
                [newChatID + ".userInfo"]: {
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    uid: user.uid
                },
                [newChatID + ".timestamp"]: serverTimestamp()
            });
            await updateDoc(doc(db, "UserChats", user.uid), {
                [newChatID + ".userInfo"]: {
                    displayName: auth.currentUser.displayName,
                    photoURL: auth.currentUser.photoURL,
                    uid: auth.currentUser.uid
                },
                [newChatID + ".timestamp"]: serverTimestamp()
            });
        }
        setSearchResults([]);
        setChatID(newChatID);
    }

    return (
        <div id="search">
            <div id="search-input">
                <input 
                    placeholder="Search for a user..." 
                    onChange={handleInput} 
                    value={search}
                    onKeyDown={handleEnter}
                />
                <button id="search-button" onClick={handleSearch}>Search</button>
            </div>
            <div id="search-results">
                {searchResults.map((user, index) => (
                    <div key={index} className="contact" onClick={() => createChat(user)}><UserDetails user={user} /></div>
                ))}
            </div>
            <hr />
        </div>
    );
}

export default Search;