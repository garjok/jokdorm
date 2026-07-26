"use client";

import { Dorm } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface DormCardProps {
  dorm: Dorm;
}

export function DormCard({ dorm }: DormCardProps) {
  return (
    <Link href={`/dorms/${dorm.id}`} className="block">
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold line-clamp-1">{dorm.name}</h3>
            {dorm.rooms_available > 0 && (
              <Badge variant="secondary">
                ว่าง {dorm.rooms_available} ห้อง
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-1">{dorm.address}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-500 text-lg">
              {"★".repeat(Math.round(dorm.avg_rating || 0))}
              {"☆".repeat(5 - Math.round(dorm.avg_rating || 0))}
            </span>
            <span className="text-sm text-gray-600">
              {dorm.avg_rating?.toFixed(1) || "0.0"} ({dorm.review_count || 0} รีวิว)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(dorm.price_per_month)}
            <span className="text-sm font-normal text-gray-500"> / เดือน</span>
          </p>
          {dorm.phone && (
            <p className="text-sm text-gray-500 mt-2">📞 {dorm.phone}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
