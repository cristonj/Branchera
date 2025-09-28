'use client';

export default function Tag({ children, variant = 'default', className = '' }) {
  const baseClasses = "inline-block px-2 py-0.5 text-xs rounded-full font-medium border";
  
  const variants = {
    default: "bg-gray-50 text-gray-500 border-gray-200",
    primary: "bg-blue-50 text-blue-600 border-blue-200",
    success: "bg-green-50 text-green-600 border-green-200",
    warning: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };
  
  const variantClasses = variants[variant] || variants.default;
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}