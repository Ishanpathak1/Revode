import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../firebaseConfig";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const provider = new GoogleAuthProvider();

    // Email/Password Sign-Up
    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User signed up:", userCredential.user);
        } catch (error) {
            console.error("Error signing up:", error.message);
        }
    };

    // Google Sign-Up
    const handleGoogleSignUp = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("User signed up with Google:", result.user);
        } catch (error) {
            console.error("Error with Google sign-up:", error.message);
        }
    };

    return (
        <div>
            <form onSubmit={handleSignUp}>
                <h2>Sign Up</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Sign Up</button>
            </form>
            <div>
                <h3>Or</h3>
                <button onClick={handleGoogleSignUp}>Sign Up with Google</button>
            </div>
        </div>
    );
};

export default SignUp;