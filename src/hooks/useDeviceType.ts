"use client";

import { useState, useEffect } from "react";

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isClient ? isMobile : true;
}