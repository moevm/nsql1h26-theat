import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DecorationProvider } from "./contexts/DecorationContext";
import { HomePage } from "./components/HomePage";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { DecorationManagement } from "./components/DecorationManagement";
import { AdminPanel } from "./components/AdminPanel";
import { Toaster } from "./components/ui/sonner";

type View = "home" | "login" | "register" | "decorations" | "admin";

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth();
  const [view, setView] = useState<View>("home");

  React.useEffect(() => {
    setView(isAuthenticated ? "decorations" : "home");
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (view === "login") {
      return (
        <>
          <LoginForm
            onBack={() => setView("home")}
            onSuccess={() => setView("decorations")}
          />
          <Toaster />
        </>
      );
    }

    if (view === "register") {
      return (
        <>
          <RegisterForm
            onBack={() => setView("home")}
            onSuccess={() => setView("decorations")}
          />
          <Toaster />
        </>
      );
    }

    return (
      <>
        <HomePage
          onLogin={() => setView("login")}
          onRegister={() => setView("register")}
        />
        <Toaster />
      </>
    );
  }

  if (view === "admin" && currentUser?.role === "admin") {
    return (
      <>
        <AdminPanel onBack={() => setView("decorations")} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <DecorationManagement
        onAdminPanel={
          currentUser?.role === "admin" ? () => setView("admin") : undefined
        }
      />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DecorationProvider>
        <AppContent />
      </DecorationProvider>
    </AuthProvider>
  );
}
