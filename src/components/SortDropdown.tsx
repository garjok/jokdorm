"use client";

import { Select } from "@/components/ui/select";
import { SortOption } from "@/types";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "rating_desc", label: "⭐ ดาวมาก → น้อย" },
  { value: "price_asc", label: "💰 ราคาต่ำ → สูง" },
  { value: "price_desc", label: "💰 ราคาสูง → ต่ำ" },
  { value: "newest", label: "🕒 ล่าสุด" },
  { value: "positive_reviews", label: "👍 รีวิวแง่บวกมาก → น้อย" },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="w-full md:w-64"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
