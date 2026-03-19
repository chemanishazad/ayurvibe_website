import React from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '@/assets/loader.json';

interface FullScreenLoaderProps {
  label?: string;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ label = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card/90 px-6 py-6 shadow-xl border border-border/60">
        <div className="h-16 w-16">
          <Lottie
            animationData={loaderAnimation}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default FullScreenLoader;

