import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DecorationProvider } from './contexts/DecorationContext';
import { HomePage } from './components/HomePage';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { DecorationManagement } from './components/DecorationManagement';
import { Toaster } from './components/ui/sonner';

type View = 'home' | 'login' | 'register' | 'decorations';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<View>('home');

  React.useEffect(() => {
    setView(isAuthenticated ? 'decorations' : 'home');
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (view === 'login') {
      return (
        <>
          <LoginForm onBack={() => setView('home')} onSuccess={() => setView('decorations')} />
          <Toaster />
        </>
      );
    }

    if (view === 'register') {
      return (
        <>
          <RegisterForm onBack={() => setView('home')} onSuccess={() => setView('decorations')} />
          <Toaster />
        </>
      );
    }

    return (
      <>
        <HomePage onLogin={() => setView('login')} onRegister={() => setView('register')} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <DecorationManagement />
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
