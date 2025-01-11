import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect} from "firebase/auth";
import { collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";

const LoginPage = () => {
  const [theme] = useState(() => {
    return localStorage.getItem('theme') || "linear-gradient(pink, #ff6ec7)";
  });
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // Get the authenticated user
      if (user) {
          await registerUser(user); // Pass the authenticated user to the registerUser function
      } else {
          console.error("No user found after sign-in.");
      }
    } catch (error) {
        console.error("Error during sign-in: ", error);
    }
  };
  const registerUser = async (user) => {
    try {
      // Query Firestore to check if the user already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        // If the user is not found in Firestore, add them
        await addDoc(usersRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        });
        await setDoc(doc(db, "UserChats", user.uid), {});
      }
    } catch (error) {
      console.error("Error adding user: ", error);
    }
  };

  return (
    <div id="login-container" style={{background: theme}}>
      <header>
        <h1>Galbaat</h1>
        <p className="tagline">Connect instantly, chat seamlessly</p>
      </header>
      <div className="login-content">
        <h2>Welcome to Galbaat!</h2>
        <p className="login-description">
          Sign in with your Google account to start chatting instantly.
        </p>
        <button onClick={googleSignIn} className="btn btn-primary btn-lg signin-button">
          <i className="fa fa-google"></i> Continue with Google
        </button>
      </div>
    </div>
  );
}

export default LoginPage;