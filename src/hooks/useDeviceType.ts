"use client";

import { useState, useEffect, useCallback } from "react";

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const checkDevice = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [checkDevice]);

  return isMobile;
}