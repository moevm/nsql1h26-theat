import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from './AuthContext';

export type DecorationCategory = 'costume' | 'furniture' | 'background' | 'props' | 'construction';
export type DecorationStatus = 'in-stock' | 'out-of-stock';

export interface BaseDecoration {
  id: string;
  name: string;
  category: DecorationCategory;
  status: DecorationStatus;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  ownerName: string;
  ownerPhone: string;
  image?: string;
  authorId?: string;
  createdBy: string;
  createdAt: string;
  lastEditedAt: string;
}

export interface CostumeDecoration extends BaseDecoration {
  category: 'costume';
  size: string;
  color: string;
  era: string;
  condition: string;
}

export interface FurnitureDecoration extends BaseDecoration {
  category: 'furniture';
  type: string;
  material: string;
  dimensions: string;
  period: string;
}

export interface BackgroundDecoration extends BaseDecoration {
  category: 'background';
  type: string;
  size: string;
  theme: string;
}

export interface PropsDecoration extends BaseDecoration {
  category: 'props';
  type: string;
  material: string;
  size: string;
}

export interface ConstructionDecoration extends BaseDecoration {
  category: 'construction';
  type: string;
  dimensions: string;
  material: string;
}

export type Decoration =
  | CostumeDecoration
  | FurnitureDecoration
  | BackgroundDecoration
  | PropsDecoration
  | ConstructionDecoration;

interface DecorationContextType {
  decorations: Decoration[];
  addDecoration: (decoration: Omit<Decoration, 'id' | 'createdAt' | 'lastEditedAt'>) => Promise<void>;
  updateDecoration: (id: string, decoration: Partial<Decoration>) => Promise<void>;
  deleteDecoration: (id: string) => Promise<void>;
  getDecoration: (id: string) => Decoration | undefined;
  searchDecorations: (query: string) => Decoration[];
  filterDecorations: (filters: Partial<Decoration>) => Decoration[];
  refreshDecorations: () => Promise<void>;
}

const DecorationContext = createContext<DecorationContextType | undefined>(undefined);

export const useDecorations = () => {
  const context = useContext(DecorationContext);
  if (!context) {
    throw new Error('useDecorations must be used within DecorationProvider');
  }
  return context;
};

export const DecorationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [decorations, setDecorations] = useState<Decoration[]>([]);

  const refreshDecorations = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      setDecorations([]);
      return;
    }

    const data = await apiFetch<Decoration[]>('/decorations');
    setDecorations(data);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshDecorations();
    } else {
      setDecorations([]);
    }
  }, [isAuthenticated, refreshDecorations]);

  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem('accessToken')) {
        void refreshDecorations();
      } else {
        setDecorations([]);
      }
    };

    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, [refreshDecorations]);

  const addDecoration = async (decoration: Omit<Decoration, 'id' | 'createdAt' | 'lastEditedAt'>) => {
    const created = await apiFetch<Decoration>('/decorations', {
      method: 'POST',
      body: JSON.stringify(decoration),
    });
    setDecorations((prev) => [created, ...prev]);
  };

  const updateDecoration = async (id: string, updates: Partial<Decoration>) => {
    const updatedDecoration = await apiFetch<Decoration>(`/decorations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    setDecorations((prev) => prev.map((decoration) =>
      decoration.id === id ? updatedDecoration : decoration
    ));
  };

  const deleteDecoration = async (id: string) => {
    const previousDecorations = decorations;
    setDecorations((prev) => prev.filter((decoration) => decoration.id !== id));

    try {
      await apiFetch<null>(`/decorations/${id}`, { method: 'DELETE' });
    } catch (error) {
      setDecorations(previousDecorations);
      throw error;
    }
  };

  const getDecoration = (id: string) => {
    return decorations.find(d => d.id === id);
  };

  const searchDecorations = (query: string) => {
    const lowerQuery = query.trim().toLocaleLowerCase('ru-RU');
    if (!lowerQuery) return decorations;
    return decorations.filter(d =>
      d.name.toLocaleLowerCase('ru-RU').includes(lowerQuery)
    );
  };

  const filterDecorations = (filters: Partial<Decoration>) => {
    return decorations.filter(d => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const currentValue = d[key as keyof Decoration];
        if (typeof value === 'string') {
          return String(currentValue ?? '')
            .toLocaleLowerCase('ru-RU')
            .includes(value.trim().toLocaleLowerCase('ru-RU'));
        }
        return currentValue === value;
      });
    });
  };

  return (
    <DecorationContext.Provider
      value={{
        decorations,
        addDecoration,
        updateDecoration,
        deleteDecoration,
        getDecoration,
        searchDecorations,
        filterDecorations,
        refreshDecorations,
      }}
    >
      {children}
    </DecorationContext.Provider>
  );
};
