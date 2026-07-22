import React, { createContext, useContext, useState, ReactNode } from "react";
import { X } from "lucide-react";

type DialogType = "alert" | "confirm" | "prompt";

interface DialogOptions {
  title: string;
  description?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  defaultValue?: string;
  placeholder?: string;
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  prompt: (options: DialogOptions) => Promise<string | null>;
  alert: (options: DialogOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [resolveFn, setResolveFn] = useState<((value: any) => void) | null>(null);

  const confirm = (opts: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions({ ...opts, type: "confirm" });
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  };

  const prompt = (opts: DialogOptions) => {
    return new Promise<string | null>((resolve) => {
      setOptions({ ...opts, type: "prompt" });
      setInputValue(opts.defaultValue || "");
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  };

  const alert = (opts: DialogOptions | string) => {
    return new Promise<void>((resolve) => {
      const finalOpts = typeof opts === "string" ? { title: "Notice", description: opts } : opts;
      setOptions({ ...finalOpts, type: "alert" });
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  };

  const handleClose = (value: any) => {
    setIsOpen(false);
    if (resolveFn) {
      resolveFn(value);
      setResolveFn(null);
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div 
            className="bg-app-bg border border-app-border rounded-2xl p-6 max-w-md w-full shadow-2xl mx-4 animate-in fade-in zoom-in duration-200 relative"
          >
            <button
              onClick={() => handleClose(options.type === "prompt" ? null : false)}
              className="absolute top-4 right-4 text-app-text-muted hover:text-app-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-app-text mb-2">
              {options.title}
            </h3>
            
            {options.description && (
              <p className="text-sm text-app-text-secondary mb-6">
                {options.description}
              </p>
            )}

            {options.type === "prompt" && (
              <div className="mb-6">
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={options.placeholder}
                  className="w-full px-4 py-3 bg-app-surface border border-app-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-app-text"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleClose(inputValue);
                  }}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              {options.type !== "alert" && (
                <button
                  onClick={() => handleClose(options.type === "prompt" ? null : false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-app-text-secondary hover:text-app-text hover:bg-app-surface transition-colors"
                >
                  {options.cancelText || "Cancel"}
                </button>
              )}
              <button
                onClick={() => handleClose(options.type === "prompt" ? inputValue : true)}
                className={`px-5 py-2.5 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg ${
                  options.danger 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                    : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20"
                }`}
              >
                {options.confirmText || (options.type === "alert" ? "OK" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
