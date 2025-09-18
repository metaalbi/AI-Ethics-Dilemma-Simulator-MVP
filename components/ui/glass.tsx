export function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

export function Button({ 
  children, 
  className = "", 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`glass-button px-4 py-2 rounded-lg text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="grid gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`glass-input ${className}`}
        {...props}
      />
    </div>
  );
}