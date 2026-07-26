"use client";

import { useState } from "react";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = "md",
}: RatingStarsProps) {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${sizeClasses[size]} transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer"
          } ${
            star <= (hover || value)
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
}
