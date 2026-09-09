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

  // Consulta estricta a la tabla 'perfiles' en Supabase para obtener el perfil y rol real
  const fetchAndSetUserProfile = async (supabaseUser, currentSession) => {
    if (!supabaseUser) {
      setUser(null);
      return null;
    }

    let perfil = null;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error) {
          console.warn('[Auth] Consulta a tabla "perfiles":', error.message);
        } else if (data) {
          perfil = data;
        }
      } catch (err) {
        console.warn('[Auth] Excepción al consultar "perfiles":', err.message);
      }
    }

    // El rol real se obtiene de la tabla 'perfiles'; si aún no existe registro, fallback a metadata del usuario
    const rawRol = perfil?.rol || supabaseUser.user_metadata?.rol || 'usuario';
    const rol = rawRol === 'admin' ? 'desarrollador' : rawRol;
    const hierarchyInfo = ROLE_HIERARCHY[rol] || ROLE_HIERARCHY.usuario;
    const nivel_prioridad = perfil?.nivel_prioridad !== undefined 
      ? perfil.nivel_prioridad 
      : hierarchyInfo.nivel;

    const formattedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      nombre: perfil?.nombre || supabaseUser.user_metadata?.nombre || supabaseUser.email.split('@')[0],
      rol,
      nivel: hierarchyInfo.nivel,
      peso: hierarchyInfo.peso,
      nivel_prioridad,
      perfil,
      token: currentSession?.access_token || null
    };

    setUser(formattedUser);
    return formattedUser;
  };

  // Cargar sesión persistente de Supabase Auth
  useEffect(() => {
    const initAuth = async () => {
      if (!supabase) {
        console.warn('[Auth] Supabase no está configurado.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setSession(data.session);
          await fetchAndSetUserProfile(data.session.user, data.session);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        console.warn('[Auth] Error al obtener sesión inicial de Supabase:', err.message);
        setUser(null);
        setSession(null);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchAndSetUserProfile(currentSession.user, currentSession);
          } else {
            setUser(null);
          }
        }
      );

      setLoading(false);

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    };

    initAuth();
  }, []);

  // Iniciar Sesión Estricto (Sin mocks, sin bypass)
  const login = async (email, password) => {
    setLoading(true);

    if (!supabase) {
      setLoading(false);
      throw new Error('El cliente de Supabase no está inicializado.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setLoading(false);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Credenciales inválidas. Verifica tu correo electrónico y contraseña.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('El correo electrónico no ha sido confirmado.');
      }
      throw new Error(error.message || 'Error de autenticación.');
    }

    if (!data?.user) {
      setLoading(false);
      throw new Error('No se pudo autenticar el usuario en Supabase Auth.');
    }

    setSession(data.session);

    // Obtener perfil real desde la tabla perfiles
    const userProfile = await fetchAndSetUserProfile(data.user, data.session);
    setLoading(false);
    return { success: true, user: userProfile };
  };

  // Registro de nuevo usuario en Supabase Auth
  const signUp = async (email, password, nombre, rol = 'usuario') => {
    setLoading(true);

    if (!supabase) {
      setLoading(false);
      throw new Error('El cliente de Supabase no está inicializado.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre: nombre.trim(),
          rol
        }
      }
    });

    if (error) {
      setLoading(false);
      throw new Error(error.message || 'Error al registrar el usuario.');
    }

    if (data?.user) {
      // Registrar o actualizar perfil en la tabla 'perfiles'
      try {
        await supabase.from('perfiles').upsert({
          id: data.user.id,
          email: data.user.email,
          nombre: nombre.trim(),
          rol,
          nivel_prioridad: ROLE_HIERARCHY[rol]?.nivel || 4
        });
      } catch (e) {
        console.warn('[Auth] Error al guardar en tabla "perfiles":', e.message);
      }

      if (data.session) {
        setSession(data.session);
        await fetchAndSetUserProfile(data.user, data.session);
      }
    }

    setLoading(false);
    return { success: true, user: data?.user };
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
