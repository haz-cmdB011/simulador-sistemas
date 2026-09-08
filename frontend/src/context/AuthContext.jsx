import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// Mapeo de jerarquía y niveles de prioridad
export const ROLE_HIERARCHY = {
  admin: { label: 'Administrador', nivel: 3, badgeColor: '#818cf8', icon: 'ShieldAlert' },
  operador: { label: 'Operador', nivel: 2, badgeColor: '#06b6d4', icon: 'ShieldCheck' },
  usuario: { label: 'Usuario Estándar', nivel: 1, badgeColor: '#10b981', icon: 'User' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión persistente o inicializar
  useEffect(() => {
    const initAuth = async () => {
      // 1. Si Supabase está configurado, escuchar cambios de autenticación
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            setSession(data.session);
            extractAndSetUser(data.session.user);
          }
        } catch (err) {
          console.warn('[Auth] Error al obtener sesión de Supabase:', err.message);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            setSession(currentSession);
            if (currentSession?.user) {
              extractAndSetUser(currentSession.user);
            } else {
              // Si no hay sesión en Supabase y no es sesión local persistida
              const localUser = localStorage.getItem('sim_user');
              if (!localUser) {
                setUser(null);
              }
            }
          }
        );

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } else {
        // 2. Modo Local / Fallback persistente
        const savedUser = localStorage.getItem('sim_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem('sim_user');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const extractAndSetUser = (supabaseUser) => {
    const rol = supabaseUser.user_metadata?.rol || 'usuario';
    const nivel_prioridad = ROLE_HIERARCHY[rol]?.nivel || 1;
    
    const formattedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      nombre: supabaseUser.user_metadata?.nombre || supabaseUser.email.split('@')[0],
      rol,
      nivel_prioridad,
      token: session?.access_token || null
    };

    setUser(formattedUser);
    localStorage.setItem('sim_user', JSON.stringify(formattedUser));
    setLoading(false);
  };

  // Iniciar Sesión
  const login = async (email, password) => {
    setLoading(true);

    // Intentar con Supabase si está disponible
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setSession(data.session);
        extractAndSetUser(data.user);
        return { success: true, user: data.user };
      } catch (error) {
        // Si falla en Supabase y es una prueba local, verificar demo fallback
        console.warn('[Supabase Auth] Falló autenticación remota:', error.message);
      }
    }

    // Modo local / Fallback para pruebas rápidas
    const rol = email.toLowerCase().includes('admin') 
      ? 'admin' 
      : email.toLowerCase().includes('operador') 
      ? 'operador' 
      : 'usuario';

    const localUser = {
      id: `usr_${Date.now()}`,
      email,
      nombre: email.split('@')[0],
      rol,
      nivel_prioridad: ROLE_HIERARCHY[rol]?.nivel || 1,
      token: `mock_jwt_token_${Date.now()}`
    };

    setUser(localUser);
    localStorage.setItem('sim_user', JSON.stringify(localUser));
    setLoading(false);
    return { success: true, user: localUser };
  };

  // Registro de nuevo usuario
  const signUp = async (email, password, nombre, rol = 'usuario') => {
    setLoading(true);

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre,
              rol
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          setSession(data.session);
          extractAndSetUser(data.user);
        }
        return { success: true, user: data.user };
      } catch (error) {
        console.warn('[Supabase Auth] Falló registro remoto:', error.message);
      }
    }

    // Fallback local
    const localUser = {
      id: `usr_${Date.now()}`,
      email,
      nombre: nombre || email.split('@')[0],
      rol,
      nivel_prioridad: ROLE_HIERARCHY[rol]?.nivel || 1,
      token: `mock_jwt_token_${Date.now()}`
    };

    setUser(localUser);
    localStorage.setItem('sim_user', JSON.stringify(localUser));
    setLoading(false);
    return { success: true, user: localUser };
  };

  // Cerrar Sesión
  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Error al cerrar sesión en Supabase:', err.message);
      }
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem('sim_user');
  };

  // Acceso rápido de demostración
  const demoLogin = (rol = 'admin') => {
    const demoEmails = {
      admin: 'admin@sistema.com',
      operador: 'operador@sistema.com',
      usuario: 'usuario@sistema.com'
    };

    const names = {
      admin: 'Administrador General',
      operador: 'Operador de Sistemas',
      usuario: 'Usuario Inversionista'
    };

    const demoUser = {
      id: `demo_${rol}_${Date.now()}`,
      email: demoEmails[rol] || `${rol}@sistema.com`,
      nombre: names[rol] || rol,
      rol,
      nivel_prioridad: ROLE_HIERARCHY[rol]?.nivel || 1,
      token: `demo_token_${rol}`
    };

    setUser(demoUser);
    localStorage.setItem('sim_user', JSON.stringify(demoUser));
  };

  // Comprobación de roles y jerarquías
  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.rol);
    }
    return user.rol === allowedRoles;
  };

  const canAccess = (minLevel = 1) => {
    if (!user) return false;
    return (user.nivel_prioridad || 1) >= minLevel;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        signUp,
        logout,
        demoLogin,
        hasRole,
        canAccess,
        rolesHierarchy: ROLE_HIERARCHY
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
