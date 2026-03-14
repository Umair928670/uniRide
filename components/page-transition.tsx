"use client";

import { useEffect, useRef, ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hide immediately before browser paints — zero flash
    el.style.opacity = "0";
    el.style.transform = "translateY(16px)";

    // Animate in as soon as GSAP is ready
    import("gsap").then(({ gsap }) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        clearProps: "transform,opacity", // ✅ clean up inline styles after animation
      });
    });
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}