"use client";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="🔍 ค้นหาหอพัก หรือที่อยู่..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 text-base pl-4"
      />
    </div>
  );
}
