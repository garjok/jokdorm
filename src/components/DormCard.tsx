"use client";

import { Dorm } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface DormCardProps {
  dorm: Dorm;
  showCompare?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
}

export function DormCard({ dorm, showCompare, isSelected, onToggleCompare }: DormCardProps) {
  const coverImage = dorm.images && dorm.images[0];

  return (
    <div className="relative">
      {showCompare && onToggleCompare && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCompare(dorm.id);
          }}
          className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
            isSelected
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-300 text-gray-400 hover:border-blue-400"
          }`}
          title="เปรียบเทียบ"
        >
          {isSelected ? "✓" : "⚖"}
        </button>
      )}
      <Link href={`/dorms/${dorm.id}`} className="block">
        <Card className={`h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden ${
          isSelected ? "ring-2 ring-blue-500" : ""
        }`}>
          {/* รูปหน้าปก */}
          {coverImage ? (
            <div className="w-full h-44 overflow-hidden">
              <img
                src={coverImage}
                alt={dorm.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
              <span className="text-4xl">🏠</span>
            </div>
          )}

          <CardContent className="p-4">
            {/* ชื่อ + ห้องว่าง */}
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold line-clamp-1 text-gray-900 dark:text-white">{dorm.name}</h3>
              {dorm.rooms_available > 0 && (
                <Badge variant="secondary" className="flex-shrink-0 ml-2">
                  ว่าง {dorm.rooms_available}
                </Badge>
              )}
            </div>

            {/* ที่อยู่ */}
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{dorm.address}</p>

            {/* ดาว */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-500 text-lg">
                {"★".repeat(Math.round(dorm.avg_rating || 0))}
                {"☆".repeat(5 - Math.round(dorm.avg_rating || 0))}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {dorm.avg_rating?.toFixed(1) || "0.0"} ({dorm.review_count || 0})
              </span>
            </div>

            {/* ราคา */}
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(dorm.price_per_month)}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / เดือน</span>
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
