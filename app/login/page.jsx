"use client";

/**
 * app/login/page.jsx
 * ------------------------------------------------------------------
 * Wires LoginComponent to the real signInWithEmailAndPassword call —
 * this is the one auth action safe to call straight from the client,
 * as documented in LoginComponent's own doc comment.
 * ------------------------------------------------------------------ */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import LoginComponent from "@/components/auth/LoginComponent";

export default function LoginPage() {
  const router = useRouter();

  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  async function handleSignIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
    router.push("/dashboard");
  }

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <LoginComponent
      onSignIn={handleSignIn}
      onForgotPasswordClick={() => router.push("/reset-password")}
    />
  );
}
