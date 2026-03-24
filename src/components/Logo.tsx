import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', className, showText = true }) => {
  const isDark = variant === 'dark';
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Monogram Icon */}
      <div className={cn(
        "w-10 h-10 flex items-center justify-center font-display font-bold text-xl rounded-sm border-2",
        isDark ? "bg-charcoal text-teal border-teal" : "bg-white text-charcoal border-charcoal"
      )}>
        CM
      </div>
      
      {/* Wordmark */}
      {showText && (
        <div className={cn(
          "font-display font-bold text-lg tracking-[0.2em] uppercase",
          isDark ? "text-charcoal" : "text-white"
        )}>
          Crystalline Max
        </div>
      )}
    </div>
  );
};
