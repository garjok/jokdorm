"use client";

import { Review } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "./RatingStars";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {(review.user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">
                {review.user?.email?.split("@")[0] || "ผู้ใช้"}
              </p>
              <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
            </div>
          </div>
          <RatingStars value={review.rating} readonly size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        {review.comment && (
          <p className="text-gray-700 mb-3">{review.comment}</p>
        )}
        <div className="space-y-2">
          {review.pros && review.pros.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.pros.map((pro, i) => (
                <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  ✓ {pro}
                </Badge>
              ))}
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.cons.map((con, i) => (
                <Badge key={i} variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                  ✗ {con}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
