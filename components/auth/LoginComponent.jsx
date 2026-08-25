"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ------------------------------------------------------------------ *
 * Maps Firebase Auth error codes to messages a patient/staff member
 * can actually act on. Firebase's own error.message is meant for
 * developers, not end users — e.g. "auth/user-disabled" is exactly
 * what happens when an admin uses the Employee component's "Block
 * Access" button, so that one in particular needs to say so plainly
 * rather than showing a generic "something went wrong".
 * ------------------------------------------------------------------ */
function friendlyAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact your administrator.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return "Couldn't sign in — please try again.";
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Firebase hookup:
 *
 *   onSignIn(email, password) => call Firebase's client SDK directly:
 *     signInWithEmailAndPassword(auth, email, password). This is the
 *     one auth action in this project that's totally fine straight
 *     from the client — unlike creating/blocking/resetting *other*
 *     people's accounts (see the Employee component's doc comment),
 *     a user signing themselves in has no "wrong session" pitfall.
 *     Let it throw on failure — this component maps the Firebase
 *     error code to a friendly message itself.
 *
 *   onForgotPasswordClick() => called when "Forgot password?" is
 *     clicked. Wire this to however you navigate to the Reset
 *     Password component/page in your app (e.g. a Next.js route
 *     push). If you'd rather this be a plain link instead of a
 *     callback, pass `resetPasswordHref` and leave this prop unset.
 */
export default function LoginComponent({
  hospitalName = "Upazila Health Complex",
  logoUrl = null,
  onSignIn = async () => {
    throw new Error("onSignIn isn't wired up yet — see the component's doc comment for how to implement it.");
  },
  onForgotPasswordClick,
  resetPasswordHref,
} = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(""); // "", "loading", "error"
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (!isValidEmail(email.trim())) {
      setStatus("error");
      setErrorMessage("That doesn't look like a valid email address.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    try {
      await onSignIn(email.trim(), password);
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(friendlyAuthError(err));
    }
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
          <p className="text-xs text-slate-400 mt-0.5">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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

          <div>
            <label className="text-xs text-slate-500 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="border rounded px-3 py-2 text-sm w-full pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {status === "error" && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password || status === "loading"}
            className="w-full text-sm bg-slate-800 disabled:bg-slate-300 text-white py-2 rounded font-medium"
          >
            {status === "loading" ? "Signing in…" : "Sign In"}
          </button>

          <div className="text-center pt-1">
            {onForgotPasswordClick ? (
              <button type="button" onClick={onForgotPasswordClick} className="text-xs text-slate-500 hover:text-slate-800 underline">
                Forgot password?
              </button>
            ) : resetPasswordHref ? (
              <a href={resetPasswordHref} className="text-xs text-slate-500 hover:text-slate-800 underline">
                Forgot password?
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
