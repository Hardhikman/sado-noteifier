import React, { createContext, useContext, useState } from 'react';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
};

const Trigger = ({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode;
  [key: string]: any;
}) => {
  const { setOpen } = useTooltip();
  
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
};

const Content = ({ 
  children, 
  variant = 'default',
  ...props 
}: { 
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  [key: string]: any;
}) => {
  const { open } = useTooltip();
  
  if (!open) return null;
  
  const variantClasses = {
    default: 'bg-gray-800 text-white',
    destructive: 'bg-red-600 text-white',
    success: 'bg-green-600 text-white'
  };
  
  return (
    <div 
      className={`absolute top-full mt-2 px-3 py-1.5 text-sm rounded-md shadow-lg z-50 ${variantClasses[variant]} whitespace-nowrap`}
      {...props}
    >
      {children}
    </div>
  );
};

const Tooltip = {
  Provider,
  Trigger,
  Content
};

export { Tooltip };