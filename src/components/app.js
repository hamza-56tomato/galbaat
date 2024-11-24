import { useState, useEffect, useRef } from "react";
import Chat from "./chat";
import LoginPage from "./loginPage";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";

const App = () => {
    const [user] = useAuthState(auth);
    return (
        <div id="app">
            {!user ? <LoginPage /> : <Chat />}
        </div>
    );
} 

export default App;