"use client";

/**
 * app/login/page.jsx
 * ------------------------------------------------------------------
 * Wires LoginComponent to the real signInWithEmailAndPassword call —
 * this is the one auth action safe to call straight from the client,
 * as documented in LoginComponent's own doc comment.
 * ------------------------------------------------------------------ */
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginComponent from "@/components/auth/LoginComponent";

export default function LoginPage() {
  const router = useRouter();

  async function handleSignIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
    router.push("/dashboard");
  }

  return (
    <LoginComponent
      onSignIn={handleSignIn}
      onForgotPasswordClick={() => router.push("/reset-password")}
    />
  );
}
