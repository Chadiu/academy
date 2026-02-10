import React, { useRef, useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Upload, FileText, X, Download, Lock, Check, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles = {
    success: {
      bg: 'from-green-500/25 to-green-500/10',
      border: 'border-green-500/40',
      glow: 'shadow-[0_0_30px_rgba(34,197,94,0.15)]',
      icon: <CheckCircle size={20} className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />,
      titleColor: 'text-green-400'
    },
    error: {
      bg: 'from-red-500/25 to-red-500/10',
      border: 'border-red-500/40',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
      icon: <AlertCircle size={20} className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />,
      titleColor: 'text-red-400'
    },
    warning: {
      bg: 'from-yellow-500/25 to-yellow-500/10',
      border: 'border-yellow-500/40',
      glow: 'shadow-[0_0_30px_rgba(250,204,21,0.15)]',
      icon: <AlertTriangle size={20} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />,
      titleColor: 'text-yellow-400'
    }
  };

  const style = styles[toast.type];

  return (
    <div
      className={`
        relative overflow-hidden
        ${style.bg}
        ${style.border} border backdrop-blur-2xl rounded-2xl p-4
        ${style.glow} animate-slide-in-right
        flex items-start gap-3 min-w-[340px] max-w-[440px] shadow-2xl
      `}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

      <div className="flex-shrink-0 mt-0.5 relative z-10">{style.icon}</div>
      <div className="flex-1 min-w-0 relative z-10">
        <p className={`font-bold text-sm ${style.titleColor}`}>{toast.title}</p>
        <p className="text-sm text-zinc-300/90 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 relative z-10"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }> = ({ children, className = '', onClick, disabled }) => (
  <div
    onClick={!disabled ? onClick : undefined}
    className={`
      glass-panel relative rounded-3xl p-6 transition-all duration-500 overflow-hidden
      ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      ${onClick && !disabled ? 'cursor-pointer hover-lift border-gradient-gold hover:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(250,204,21,0.08)]' : ''}
      ${className}
    `}
  >
    {}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

    {}
    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

    <div className="relative z-10">{children}</div>
  </div>
);

export const PrimaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean }> = ({ children, onClick, className = '', disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      relative group overflow-hidden rounded-full px-8 py-3 font-helvetica-bold text-[#D4AF37] transition-all duration-300
      border border-[#D4AF37] bg-[#050505]
      ${disabled
        ? 'opacity-50 cursor-not-allowed grayscale'
        : 'hover:bg-[#D4AF37] hover:text-black hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-[0.97]'
      }
      ${className}
    `}
  >
    <span className="relative z-10 flex items-center gap-2 justify-center">{children}</span>
  </button>
);

export const SecondaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      relative group overflow-hidden rounded-full px-8 py-3 font-helvetica text-zinc-400
      border border-white/10 bg-transparent
      hover:text-white hover:border-white/30
      hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
      transition-all duration-300 active:scale-[0.97] ${className}
    `}
  >
    <span className="relative z-10 flex items-center gap-2 justify-center">{children}</span>
  </button>
);

export const IconButton: React.FC<{ icon: React.ReactNode; onClick?: () => void; className?: string; title?: string }> = ({ icon, onClick, className = '', title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      relative group p-3 rounded-xl
      border border-white/10 bg-white/[0.03] backdrop-blur-sm text-zinc-400
      hover:text-black hover:bg-[#D4AF37] hover:border-[#D4AF37]
      hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]
      transition-all duration-300 active:scale-95 flex items-center justify-center
      ${className}
    `}
  >
    <span className="relative z-10">{icon}</span>
  </button>
);

export const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ progress, className = '' }) => (
  <div className={`relative h-1.5 w-full bg-zinc-900 border border-white/5 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-700 ease-out relative"
      style={{ width: `${progress}%` }}
    >
      <div className="absolute inset-0 bg-white/10 animate-pulse" />
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; type?: 'default' | 'success' | 'warning' | 'purple' | 'locked' }> = ({ children, type = 'default' }) => {
  const styles = {
    default: 'bg-zinc-900 text-zinc-400 border-white/10',
    success: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]',
    warning: 'bg-white/5 text-white border-white/10',
    purple: 'bg-zinc-800 text-zinc-300 border-white/5',
    locked: 'bg-black/40 text-zinc-600 border-white/5',
  };

  return (
    <span className={`relative px-3 py-1 rounded-full text-[10px] font-helvetica-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 ${styles[type]}`}>
      <span className="relative z-10 flex items-center gap-1.5">
        {type === 'locked' && <Lock size={10} />}
        {children}
      </span>
    </span>
  );
};

export const LiquidGlass: React.FC<{
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  hover?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', gold = false, hover = true, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  }, []);

  const glowColor = gold ? '212, 175, 55' : '255, 255, 255';

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative rounded-[24px] overflow-hidden
        ${hover ? 'transition-transform duration-500 ease-out hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {}
      <div
        className={`
          absolute inset-0 rounded-[24px]
          backdrop-blur-[8px]
          border
          ${gold
            ? 'bg-[#D4AF37]/[0.03] border-[#D4AF37]/20 group-hover:border-[#D4AF37]/40'
            : 'bg-white/[0.02] border-white/[0.08] group-hover:border-white/15'
          }
          transition-all duration-500
        `}
      />

      {}
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(${glowColor}, 0.12), transparent 50%)`,
        }}
      />

      {}
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(${glowColor}, 0.05), transparent 60%)`,
        }}
      />

      {}
      <div className={`
        absolute inset-x-4 top-0 h-[1px]
        ${gold
          ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent'
          : 'bg-gradient-to-r from-transparent via-white/15 to-transparent'
        }
      `} />

      {}
      <div className={`
        absolute left-0 inset-y-4 w-[1px]
        ${gold
          ? 'bg-gradient-to-b from-transparent via-[#D4AF37]/15 to-transparent'
          : 'bg-gradient-to-b from-transparent via-white/10 to-transparent'
        }
      `} />

      {}
      <div className="relative z-10">{children}</div>

      {}
      <div className={`
        absolute inset-x-8 bottom-0 h-[1px]
        ${gold
          ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent'
          : 'bg-gradient-to-r from-transparent via-white/[0.05] to-transparent'
        }
      `} />

      {}
      {hover && (
        <div
          className={`
            absolute -inset-[1px] rounded-[25px] opacity-0 group-hover:opacity-100
            transition-opacity duration-500 pointer-events-none blur-xl
            ${gold
              ? 'bg-gradient-to-br from-[#D4AF37]/15 via-transparent to-[#D4AF37]/5'
              : 'bg-gradient-to-br from-white/10 via-transparent to-white/5'
            }
          `}
          style={{ zIndex: -1 }}
        />
      )}
    </div>
  );
};

export const LiquidGlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  hover?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', gold = false, hover = true, onClick }) => (
  <LiquidGlass gold={gold} hover={hover} onClick={onClick} className={className}>
    <div className="p-8">{children}</div>
  </LiquidGlass>
);

export const LiquidGlassInput: React.FC<{
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  className?: string;
  rightElement?: React.ReactNode;
}> = ({ type = 'text', placeholder, value, onChange, required, minLength, className = '', rightElement }) => (
  <div className="relative group">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      className={`
        w-full bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.08] group-hover:border-white/15
        rounded-xl px-4 py-3.5 ${rightElement ? 'pr-12' : ''}
        text-white placeholder-zinc-500
        focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20
        transition-all duration-300
        ${className}
      `}
    />
    {rightElement && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightElement}
      </div>
    )}
    {}
    <div className="absolute inset-0 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none bg-[#D4AF37]/5 blur-xl" style={{ zIndex: -1 }} />
  </div>
);

export const LiquidGlassSelect: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, options, className = '' }) => (
  <div className="relative group">
    <select
      value={value}
      onChange={onChange}
      className={`
        w-full bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.08] group-hover:border-white/15
        rounded-xl px-4 py-3.5
        text-white appearance-none cursor-pointer
        focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20
        transition-all duration-300
        ${className}
      `}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
          {opt.label}
        </option>
      ))}
    </select>
    {}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
);

export const LiquidGlassButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}> = ({ children, onClick, variant = 'primary', disabled = false, className = '', type = 'button' }) => {
  const baseStyles = `
    relative overflow-hidden rounded-xl px-6 py-3.5 font-semibold
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black
      hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-white
      hover:bg-white/[0.08] hover:border-white/20
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]
      active:scale-[0.98]
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] hover:translate-x-[150%] transition-transform duration-700 pointer-events-none" />
      )}
    </button>
  );
};

export const LiquidVideoFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative group ${className}`}>
    {}
    <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-yellow-400/20 via-yellow-500/5 to-white/10 blur-xl opacity-40 group-hover:opacity-70 transition-all duration-700" />

    {}
    <div className="glass-solid relative rounded-3xl overflow-hidden shadow-2xl border-gradient-gold">
      {}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

      {}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent pointer-events-none" />

      {}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>

      {}
      <div className="relative z-10">
        {children}
      </div>

      {}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>

    {}
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400/40 rounded-full blur-sm animate-float" style={{ animationDelay: '0s' }} />
    <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-white/30 rounded-full blur-sm animate-float" style={{ animationDelay: '1.5s' }} />
  </div>
);

export const FileDropZone: React.FC<{
  label: string;
  accept: string;
  onFileSelect: (file: File) => void;
  currentFile?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}> = ({ label, accept, onFileSelect, currentFile, isUploading = false, uploadProgress = 0 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some(acceptType => {
        if (acceptType.startsWith('.')) {
          return fileExtension === acceptType;
        }
        if (acceptType.includes('*')) {
          const [mainType] = acceptType.split('/');
          return fileType.startsWith(mainType + '/');
        }
        return fileType === acceptType;
      });

      if (isAccepted) {
        onFileSelect(file);
      } else {
        console.warn('File type not accepted:', fileType, fileExtension);
      }
    }
  };

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        group relative h-44 w-full border-2 border-dashed rounded-3xl
        bg-gradient-to-br from-zinc-900/50 to-black/50 backdrop-blur-sm
        transition-all duration-300 flex flex-col items-center justify-center p-6 overflow-hidden
        ${isUploading
          ? 'border-yellow-400/50 cursor-wait'
          : isDragging
            ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02] shadow-[0_0_40px_rgba(250,204,21,0.15)]'
            : 'border-white/10 hover:bg-zinc-800/30 hover:border-yellow-400/40 cursor-pointer hover:shadow-[0_0_30px_rgba(250,204,21,0.08)]'
        }`}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        onChange={handleChange}
        disabled={isUploading}
      />

      {}
      <div className={`absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(250,204,21,0.15)_50%,transparent_75%)] bg-[length:24px_24px] transition-opacity duration-300 ${isDragging ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'}`} />

      {}
      <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-yellow-400/30 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-yellow-400/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-yellow-400/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-yellow-400/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity" />

      {isDragging ? (
        <div className="flex flex-col items-center relative z-10 animate-pulse">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400/40 to-yellow-500/20 flex items-center justify-center text-yellow-400 mb-3 shadow-[0_0_40px_rgba(250,204,21,0.4)]">
            <Upload size={32} className="drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          </div>
          <p className="text-lg font-bold text-yellow-400">Drop file here</p>
          <p className="text-sm text-yellow-400/70 mt-1">Release to upload</p>
        </div>
      ) : isUploading ? (
        <div className="flex flex-col items-center relative z-10 w-full px-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-yellow-500/10 flex items-center justify-center text-yellow-400 mb-3 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
            <Upload size={28} className="animate-bounce drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          </div>
          <p className="text-sm font-semibold text-yellow-400 mb-3">Uploading... {uploadProgress}%</p>
          <div className="w-full max-w-xs h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-all duration-300 relative"
              style={{ width: `${uploadProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
            </div>
          </div>
        </div>
      ) : currentFile ? (
        <div className="flex flex-col items-center animate-fade-in relative z-10">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-yellow-500/10 flex items-center justify-center text-yellow-400 mb-3 shadow-[0_0_25px_rgba(250,204,21,0.2)]">
            <Check size={28} className="drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
          </div>
          <p className="text-sm font-semibold text-yellow-400 text-center break-all max-w-full px-4" title={currentFile}>{currentFile}</p>
          <p className="text-xs text-zinc-500 mt-2">Click or drag to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center relative z-10">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400/15 to-yellow-500/5 flex items-center justify-center text-yellow-400 mb-3 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.25)] transition-all duration-300 border border-yellow-400/20">
            <Upload size={28} className="group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all" />
          </div>
          <p className="text-sm font-semibold text-zinc-300">{label}</p>
          <p className="text-xs text-zinc-500 mt-1.5">Drag & drop or click to upload</p>
        </div>
      )}
    </div>
  );
};
