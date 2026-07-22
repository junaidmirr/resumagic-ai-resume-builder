import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthModalConfig {
  title?: string;
  subtitle?: string;
  showBlankOption?: boolean;
}

type AuthModalContextType = {
  isOpen: boolean;
  config?: AuthModalConfig;
  openModal: (config?: AuthModalConfig) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AuthModalConfig | undefined>(undefined);

  const openModal = (newConfig?: AuthModalConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  };
  
  const closeModal = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, config, openModal, closeModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider');
  return context;
};
