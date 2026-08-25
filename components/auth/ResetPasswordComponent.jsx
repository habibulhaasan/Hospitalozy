"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ------------------------------------------------------------------ *
 * A Firebase password reset is two separate steps that happen on two
 * separate visits to this component:
 *
 *   1. REQUEST — user enters their email, you send a reset link.
 *      This is the form shown by default.
 *
 *   2. CONFIRM — the user clicks the link in that email, which sends
 *      them back to wherever this component is mounted with
 *      ?mode=resetPassword&oobCode=XXXX in the URL (that's Firebase's
 *      standard action-link format). This component detects that on
 *      mount and switches to a "set new password" form instead.
 *
 * Both steps live in this one component because that's how the user
 * actually experiences it — they never see step 1 and step 2 as
 * separate pages, just "I asked to reset my password" and later
 * "I clicked the link and set a new one".
 * ------------------------------------------------------------------ */

function friendlyAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/user-not-found":
      return "No account found for that email.";
    case "auth/expired-action-code":
      return "This reset link has expired — request a new one.";
    case "auth/invalid-action-code":
      return "This reset link is invalid or has already been used — request a new one.";
    case "auth/weak-password":
      return "Please choose a password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return "Something went wrong — please try again.";
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Firebase hookup:
 *
 *   onSendResetEmail(email) => sendPasswordResetEmail(auth, email).
 *     Works straight from the client SDK, same as noted in the Login
 *     and Employee components — this is the one account-management
 *     action that doesn't need a backend function.
 *
 *   onVerifyResetCode(oobCode) => verifyPasswordResetCode(auth,
 *     oobCode), which both confirms the link is still valid and
 *     returns the email it belongs to (shown to the user so they can
 *     confirm it's their own reset before setting a new password).
 *     Let it throw on an expired/invalid code — this component shows
 *     a friendly message and a way to request a fresh link.
 *
 *   onConfirmReset(oobCode, newPassword) => confirmPasswordReset(auth,
 *     oobCode, newPassword).
 */
export default function ResetPasswordComponent({
  hospitalName = "Upazila Health Complex",
  logoUrl = null,
  onSendResetEmail = async () => {
    throw new Error("onSendResetEmail isn't wired up yet — see the component's doc comment for how to implement it.");
  },
  onVerifyResetCode = async () => {
    throw new Error("onVerifyResetCode isn't wired up yet — see the component's doc comment for how to implement it.");
  },
  onConfirmReset = async () => {
    throw new Error("onConfirmReset isn't wired up yet — see the component's doc comment for how to implement it.");
  },
  onGoToLogin,
  loginHref,
} = {}) {
  const [stage, setStage] = useState("checking"); // "checking" | "request" | "confirm" | "invalid" | "requestSent" | "resetDone"
  const [oobCode, setOobCode] = useState(null);
  const [resetEmail, setResetEmail] = useState(""); // the email tied to the reset link, once verified

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState(""); // "", "loading", "error"
  const [errorMessage, setErrorMessage] = useState("");

  // On mount, check whether we landed here from a reset-link email.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const code = params.get("oobCode");

    if (mode === "resetPassword" && code) {
      setOobCode(code);
      onVerifyResetCode(code)
        .then((verifiedEmail) => {
          setResetEmail(verifiedEmail || "");
          setStage("confirm");
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage(friendlyAuthError(err));
          setStage("invalid");
        });
    } else {
      setStage("request");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRequestReset(e) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isValidEmail(email.trim())) {
      setStatus("error");
      setErrorMessage("That doesn't look like a valid email address.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    try {
      await onSendResetEmail(email.trim());
      setStage("requestSent");
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(friendlyAuthError(err));
    }
  }

  async function handleConfirmReset(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setStatus("error");
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    try {
      await onConfirmReset(oobCode, newPassword);
      setStage("resetDone");
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(friendlyAuthError(err));
    }
  }

  function LoginLink({ label = "Back to Sign In" }) {
    if (onGoToLogin) {
      return (
        <button type="button" onClick={onGoToLogin} className="text-xs text-slate-500 hover:text-slate-800 underline">
          {label}
        </button>
      );
    }
    if (loginHref) {
      return (
        <a href={loginHref} className="text-xs text-slate-500 hover:text-slate-800 underline">
          {label}
        </a>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm w-full max-w-sm p-6">
        <div className="text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-14 h-14 object-contain mx-auto mb-2" />
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto mb-2 text-[10px] font-semibold text-slate-500">
              LOGO
            </div>
          )}
          <h1 className="text-base font-semibold text-slate-800">{hospitalName}</h1>
        </div>

        {stage === "checking" && (
          <p className="text-sm text-slate-400 text-center py-4">Checking your link…</p>
        )}

        {stage === "request" && (
          <form onSubmit={handleRequestReset} className="space-y-3">
            <p className="text-xs text-slate-500 mb-1">Enter your account email and we'll send you a link to reset your password.</p>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                autoComplete="username"
                className="border rounded px-3 py-2 text-sm w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {status === "error" && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={!email.trim() || status === "loading"}
              className="w-full text-sm bg-slate-800 disabled:bg-slate-300 text-white py-2 rounded font-medium"
            >
              {status === "loading" ? "Sending…" : "Send Reset Link"}
            </button>
            <div className="text-center pt-1">
              <LoginLink />
            </div>
          </form>
        )}

        {stage === "requestSent" && (
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-700">
              If an account exists for <b>{email.trim()}</b>, a reset link has been sent. Check your inbox (and spam folder).
            </p>
            <div className="pt-1">
              <LoginLink />
            </div>
          </div>
        )}

        {stage === "confirm" && (
          <form onSubmit={handleConfirmReset} className="space-y-3">
            <p className="text-xs text-slate-500 mb-1">
              Setting a new password{resetEmail ? <> for <b>{resetEmail}</b></> : ""}.
            </p>
            <div>
              <label className="text-xs text-slate-500 block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="border rounded px-3 py-2 text-sm w-full pr-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="border rounded px-3 py-2 text-sm w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {status === "error" && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={!newPassword || !confirmPassword || status === "loading"}
              className="w-full text-sm bg-slate-800 disabled:bg-slate-300 text-white py-2 rounded font-medium"
            >
              {status === "loading" ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        {stage === "resetDone" && (
          <div className="text-center space-y-3">
            <p className="text-sm text-emerald-700">Your password has been reset — you can now sign in with your new password.</p>
            <div className="pt-1">
              <LoginLink label="Go to Sign In" />
            </div>
          </div>
        )}

        {stage === "invalid" && (
          <div className="text-center space-y-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setStage("request");
                setErrorMessage("");
              }}
              className="w-full text-sm bg-slate-800 text-white py-2 rounded font-medium"
            >
              Request a New Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
