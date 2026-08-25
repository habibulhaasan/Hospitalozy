import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "Hospitalozy",
  description: "Hospital lab, billing, and administration suite",
};

/**
 * app/layout.jsx
 * ------------------------------------------------------------------
 * Root layout — everything in the app renders inside <AuthProvider>,
 * so useAuth()/usePermission() work from any page or component
 * without each one having to set up its own Firebase Auth listener.
 * ------------------------------------------------------------------ */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
