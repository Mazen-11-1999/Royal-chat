'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageAdmins: boolean;
  canAccessPremiumChat: boolean;
  canViewStatistics: boolean;
  canManageSettings: boolean;
  canAccessDatabase: boolean;
  canGrantFreeSubscription: boolean;
}

export interface AdminUser {
  id: string;
  userId?: string;
  name: string;
  username: string;
  role: 'admin' | 'owner' | 'user';
  isInvisible: boolean;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'invisible';
  permissions?: AdminPermissions;
  isOwner?: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleInvisibility: () => void;
  setInvisible: (invisible: boolean) => void;
  updateName: (name: string) => void;
  // Admin management functions (only for owner)
  createAdmin: (adminData: { username: string; password: string; name: string; permissions: AdminPermissions; userId: string }) => Promise<boolean>;
  getAdmins: () => AdminUser[];
  updateAdmin: (adminId: string, updates: Partial<AdminUser>) => Promise<boolean>;
  deleteAdmin: (adminId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'mazen@771885223'
};

const STORAGE_KEYS = {
  ADMIN_USER: 'admin_user',
  ADMIN_LIST: 'admin_list'
};

// Default permissions for owner
const OWNER_PERMISSIONS: AdminPermissions = {
  canManageUsers: true,
  canManageAdmins: true,
  canAccessPremiumChat: true,
  canViewStatistics: true,
  canManageSettings: true,
  canAccessDatabase: true,
  canGrantFreeSubscription: true
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    // FORCE LOGIN: Always show login page on entry
    // Don't auto-load saved admin user from localStorage
    // Owner must explicitly login every time
    if (typeof window !== 'undefined') {
      // Always require login - don't auto-load saved admin user
      // Always show login page
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Load admins when owner is authenticated
  useEffect(() => {
    if (user && user.role === 'owner' && user.userId) {
      loadAdminsFromAPI();
    }
  }, [user]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Trim inputs to handle accidental spaces
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    try {
      // Use API for authentication
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.admin) {
          const adminUser: AdminUser = {
            id: data.admin.id,
            userId: data.admin.userId,
            name: data.admin.name,
            username: data.admin.username,
            role: data.admin.role as 'owner' | 'admin',
            isInvisible: true, // Default to invisible
            avatar: data.admin.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            status: 'invisible',
            permissions: data.admin.permissions || OWNER_PERMISSIONS,
            isOwner: data.admin.role === 'owner'
          };
          setUser(adminUser);
          setIsAuthenticated(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(adminUser));
          }
          return true;
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    }
  };

  const updateName = (name: string) => {
    if (user) {
      const updatedUser = {
        ...user,
        name
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(updatedUser));
      }
    }
  };

  const loadAdminsFromAPI = async () => {
    if (!user || user.role !== 'owner' || !user.userId) return;
    
    try {
      const response = await fetch(`/api/admin/admins?ownerId=${user.userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.admins) {
          const adminsList = data.admins.map((admin: any) => ({
            id: admin.id,
            userId: admin.userId,
            name: admin.name,
            username: admin.username,
            role: admin.role,
            isInvisible: false,
            avatar: admin.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.username}`,
            status: 'offline' as const,
            permissions: admin.permissions,
            isOwner: admin.role === 'owner'
          }));
          setAdmins(adminsList);
        }
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const createAdmin = async (adminData: { username: string; password: string; name: string; permissions: AdminPermissions; userId: string }): Promise<boolean> => {
    if (!user || user.role !== 'owner' || !user.userId) {
      return false;
    }

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.userId,
          username: adminData.username,
          password: adminData.password,
          name: adminData.name,
          userId: adminData.userId,
          permissions: adminData.permissions
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Reload admins list
          await loadAdminsFromAPI();
          return true;
        }
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    }
    
    return false;
  };

  const getAdmins = (): AdminUser[] => {
    return admins;
  };

  const updateAdmin = async (adminId: string, updates: Partial<AdminUser>): Promise<boolean> => {
    if (!user || user.role !== 'owner' || !user.userId) {
      return false;
    }

    try {
      // Update permissions if provided
      if (updates.permissions) {
        const response = await fetch(`/api/admin/${adminId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerId: user.userId,
            permissions: updates.permissions
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            loadAdminsFromAPI();
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Error updating admin:', error);
    }
    
    return false;
  };

  const deleteAdmin = async (adminId: string): Promise<boolean> => {
    if (!user || user.role !== 'owner' || !user.userId) {
      return false;
    }

    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadAdminsFromAPI();
          return true;
        }
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
    
    return false;
  };

  const toggleInvisibility = () => {
    if (user) {
      const newInvisible = !user.isInvisible;
      const updatedUser: AdminUser = {
        ...user,
        isInvisible: newInvisible,
        status: (newInvisible ? 'invisible' : 'online') as 'online' | 'offline' | 'away' | 'invisible'
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(updatedUser));
      }
    }
  };

  const setInvisible = (invisible: boolean) => {
    if (user) {
      const updatedUser: AdminUser = {
        ...user,
        isInvisible: invisible,
        status: (invisible ? 'invisible' : 'online') as 'online' | 'offline' | 'away' | 'invisible'
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin: user?.role === 'admin' || user?.role === 'owner',
        isOwner: user?.role === 'owner' || false,
        login,
        logout,
        toggleInvisibility,
        setInvisible,
        updateName,
        createAdmin,
        getAdmins,
        updateAdmin,
        deleteAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

