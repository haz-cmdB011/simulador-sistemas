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

  // Consulta inmediata a la tabla 'perfiles' con el ID del usuario
  const loadUserProfile = async (authUser, currentSession) => {
    if (!authUser) {
      setUser(null);
      return null;
    }

    try {
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (perfilError) {
        console.warn('[Auth] Consulta a tabla perfiles:', perfilError.message);
      }

      // El rol real proviene de la tabla perfiles, con fallback a user_metadata
      const rawRol = perfil?.rol || authUser.user_metadata?.rol || 'usuario';
      const rol = rawRol === 'admin' ? 'desarrollador' : rawRol;
      const hierarchyInfo = ROLE_HIERARCHY[rol] || ROLE_HIERARCHY.usuario;

      const formattedUser = {
        id: authUser.id,
        email: authUser.email,
        nombre: perfil?.nombre || authUser.user_metadata?.nombre || authUser.email.split('@')[0],
        rol: rol,
        nivel: hierarchyInfo.nivel,
        peso: hierarchyInfo.peso,
        nivel_prioridad: perfil?.nivel_prioridad || hierarchyInfo.nivel,
        perfil: perfil || null,
        token: currentSession?.access_token || null
      };

      setUser(formattedUser);
      return formattedUser;
    } catch (err) {
      console.error('[Auth] Error al cargar perfil:', err);
      const rawRol = authUser.user_metadata?.rol || 'usuario';
      const rol = rawRol === 'admin' ? 'desarrollador' : rawRol;
      const hierarchyInfo = ROLE_HIERARCHY[rol] || ROLE_HIERARCHY.usuario;

      const formattedUser = {
        id: authUser.id,
        email: authUser.email,
        nombre: authUser.user_metadata?.nombre || authUser.email.split('@')[0],
        rol: rol,
        nivel: hierarchyInfo.nivel,
        peso: hierarchyInfo.peso,
        nivel_prioridad: hierarchyInfo.nivel,
        perfil: null,
        token: currentSession?.access_token || null
      };

      setUser(formattedUser);
      return formattedUser;
    }
  };

  // Inicializar y escuchar sesión de Supabase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] Error getSession:', error.message);
        }
        if (data?.session?.user) {
          setSession(data.session);
          await loadUserProfile(data.session.user, data.session);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        console.error('[Auth] Error al inicializar sesión:', err);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession);
          if (currentSession?.user) {
            await loadUserProfile(currentSession.user, currentSession);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    };

    initAuth();
  }, []);

  // Iniciar Sesión estricto con Supabase Auth
  const login = async (email, password) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('[Auth] Login fallido:', {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name,
        email: email.trim()
      });
      setLoading(false);
      throw error;
    }

    if (!data?.session || !data?.user) {
      setLoading(false);
      throw new Error('No se recibió la sesión del usuario autenticado.');
    }

    setSession(data.session);
    const userProfile = await loadUserProfile(data.user, data.session);
    setLoading(false);
    return { success: true, user: userProfile, session: data.session };
  };

  // Registro estricto con Supabase Auth
  const signUp = async (email, password, nombre) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre: nombre.trim()
        }
      }
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data?.session && data?.user) {
      setSession(data.session);
      await loadUserProfile(data.user, data.session);
    }

    setLoading(false);
    return { success: true, data };
  };

  // Cerrar Sesión
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[Auth] Error al cerrar sesión:', error.message);
    }
    setUser(null);
    setSession(null);
  };

  // Comprobación de roles específicos
  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.rol);
    }
    return user.rol === allowedRoles;
  };

  // Comprobación de nivel de jerarquía por peso
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
