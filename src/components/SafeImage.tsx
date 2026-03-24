import React, { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName,
  fallbackSrc,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className={cn("relative overflow-hidden bg-charcoal/50", containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-charcoal/80 z-10">
          <Loader2 className="text-teal animate-spin" size={24} />
        </div>
      )}
      
      {error || !src ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/90 text-white/20 gap-2 p-4 text-center">
          <ImageOff size={32} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Image Unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-all duration-700",
            isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100",
            className
          )}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};
