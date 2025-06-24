import { useState, useEffect } from "react";

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    // Check on mount
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    // Listen for orientation changes (mobile)
    window.addEventListener('orientationchange', () => {
      // Small delay to ensure dimensions are updated
      setTimeout(checkDevice, 100);
    });

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  const isDesktop = !isMobile && !isTablet;
  const isPortrait = screenSize.height > screenSize.width;
  const isLandscape = screenSize.width > screenSize.height;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    screenSize,
    // Utility functions
    isTouchDevice: isMobile || isTablet,
    hasSmallScreen: screenSize.width < 640,
    hasLargeScreen: screenSize.width >= 1280
  };
}
