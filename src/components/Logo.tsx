import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md", ...props }: LogoProps) {
  const sizeClasses = {
    sm: "size-8 rounded-lg",
    md: "size-10 rounded-xl",
    lg: "size-12 rounded-2xl",
  };

  const iconSizes = {
    sm: "size-5",
    md: "size-6",
    lg: "size-7",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 shadow-md shadow-red-500/25 ring-1 ring-white/20 shrink-0",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("text-white drop-shadow-sm", iconSizes[size])}
        aria-hidden="true"
      >
        {/* Modern blood droplet with translucent inner fill */}
        <path
          d="M16 3C16 3 8 12.5 8 19C8 23.4183 11.5817 27 16 27C20.4183 27 24 23.4183 24 19C24 12.5 16 3 16 3Z"
          fill="currentColor"
          fillOpacity="0.22"
        />
        <path
          d="M16 3C16 3 8 12.5 8 19C8 23.4183 11.5817 27 16 27C20.4183 27 24 23.4183 24 19C24 12.5 16 3 16 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Connected link / heartbeat pulse line representing care continuity */}
        <path
          d="M10.5 19H13L14.5 15.5L17.5 22.5L19 19H21.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Specular highlight */}
        <circle cx="12.5" cy="13.5" r="1.5" fill="white" fillOpacity="0.85" />
      </svg>
    </div>
  );
}
