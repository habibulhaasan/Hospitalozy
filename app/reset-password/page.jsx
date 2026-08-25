"use client";

/**
 * app/reset-password/page.jsx
 * ------------------------------------------------------------------
 * Wires ResetPasswordComponent to the three Firebase Auth calls it
 * needs. Firebase's password-reset email links back to THIS route
 * with ?mode=resetPassword&oobCode=... appended — ResetPasswordComponent
 * detects that itself via window.location.search, so no route param
 * handling is needed here beyond just rendering the component.
 * ------------------------------------------------------------------ */
import { useRouter } from "next/navigation";
import {
  sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import ResetPasswordComponent from "@/components/auth/ResetPasswordComponent";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <ResetPasswordComponent
      onSendResetEmail={(email) => sendPasswordResetEmail(auth, email)}
      onVerifyResetCode={(oobCode) => verifyPasswordResetCode(auth, oobCode)}
      onConfirmReset={(oobCode, newPassword) => confirmPasswordReset(auth, oobCode, newPassword)}
      onGoToLogin={() => router.push("/login")}
    />
  );
}
