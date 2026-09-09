import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// Mapeo de jerarquía oficial (Nivel 1 es el más alto y exclusivo para el Creador)
export const ROLE_HIERARCHY = {
  desarrollador: { 
    label: 'Desarrollador', 
    nivel: 1, 
    peso: 4, 
    badgeColor: '#ec4899', 
    icon: 'Terminal',
    descripcion: 'Control total para eliminar y editar cualquier perfil, registro o dato en la base de datos'
  },
  administrativo: { 
    label: 'Administrativo', 
    nivel: 2, 
    peso: 3, 
    badgeColor: '#818cf8', 
    icon: 'ShieldAlert',
    descripcion: 'Visualización de perfiles de usuario y gestión/lectura de las acciones a realizar en el sistema'
  },
  operador: { 
    label: 'Operador', 
    nivel: 3, 
    peso: 2, 
    badgeColor: '#06b6d4', 
    icon: 'ShieldCheck',
    descripcion: 'Ejecución y captura operacional estándar'
  },
  usuario: { 
    label: 'Usuario', 
    nivel: 4, 
    peso: 1, 
    badgeColor: '#10b981', 
    icon: 'User',
    descripcion: 'Acceso básico de consulta y perfil personal'
  }
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
    const rawRol = supabaseUser.user_metadata?.rol || 'usuario';
    // Mapear posible rol anterior 'admin' al nuevo 'desarrollador' o 'administrativo'
    const rol = rawRol === 'admin' ? 'desarrollador' : rawRol;
    const hierarchyInfo = ROLE_HIERARCHY[rol] || ROLE_HIERARCHY.usuario;
    
    const formattedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      nombre: supabaseUser.user_metadata?.nombre || supabaseUser.email.split('@')[0],
      rol,
      nivel: hierarchyInfo.nivel,
      peso: hierarchyInfo.peso,
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
        console.warn('[Supabase Auth] Falló autenticación remota:', error.message);
      }
    }

    // Modo local / Fallback para desarrollo
    const emailLower = email.toLowerCase();
    const rol = (emailLower.includes('desarrollador') || emailLower.includes('dev'))
      ? 'desarrollador'
      : (emailLower.includes('admin') || emailLower.includes('administrativo'))
      ? 'administrativo'
      : emailLower.includes('operador')
      ? 'operador'
      : 'usuario';

    const hierarchyInfo = ROLE_HIERARCHY[rol] || ROLE_HIERARCHY.usuario;

    const localUser = {
      id: `usr_${Date.now()}`,
      email,
      nombre: email.split('@')[0],
      rol,
      nivel: hierarchyInfo.nivel,
      peso: hierarchyInfo.peso,
      token: `mock_jwt_token_${Date.now()}`
    };

    setUser(localUser);
    localStorage.setItem('sim_user', JSON.stringify(localUser));
    setLoading(false);
    return { success: true, user: localUser };
  };

  // Registro de nuevo usuario con rol asignado
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
    const hierarchyInfo = ROLE_HIERARCHY[rol] || ROLE_HIERARCHY.usuario;
    const localUser = {
      id: `usr_${Date.now()}`,
      email,
      nombre: nombre || email.split('@')[0],
      rol,
      nivel: hierarchyInfo.nivel,
      peso: hierarchyInfo.peso,
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

  // Comprobación de roles específicos
  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.rol);
    }
    return user.rol === allowedRoles;
  };

  // Comprobación de nivel de jerarquía (por peso: 4 Desarrollador > 3 Administrativo > 2 Operador > 1 Usuario)
  const canAccessMinWeight = (minWeight = 1) => {
    if (!user) return false;
    return (user.peso || 1) >= minWeight;
  };

  // Helper flags de permisos granulares
  const canDelete = user?.rol === 'desarrollador';
  const canEditCritical = user?.rol === 'desarrollador';
  const isDesarrollador = user?.rol === 'desarrollador';
  const isAdministrativo = user?.rol === 'administrativo' || isDesarrollador;
  const isOperador = user?.rol === 'operador' || isAdministrativo;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        signUp,
        logout,
        hasRole,
        canAccessMinWeight,
        canDelete,
        canEditCritical,
        isDesarrollador,
        isAdministrativo,
        isOperador,
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
