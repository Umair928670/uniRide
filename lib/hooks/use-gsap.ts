'use client';

import { useEffect, useRef } from "react";


export function useGsap() {
  const gsap = useRef<any>(null);

  useEffect(() => {
    import("gsap").then((mod) => {
      gsap.current = mod.gsap;
    });
  }, []);

  return gsap;
}