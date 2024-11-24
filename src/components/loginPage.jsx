import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect} from "firebase/auth";
import { collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";

const LoginPage = () => {
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

  return(
    <div id="login-container">
      <header>
          <h1>Galbaat</h1>
      </header>
      <div>
          <h2>please log in brothaaa</h2>
          <button onClick={googleSignIn} className="btn btn-primary btn-lg">Sign In</button>
      </div>
    </div>
  );
}

export default LoginPage;