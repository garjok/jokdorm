"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingStars } from "./RatingStars";

interface ReviewFormProps {
  dormId: string;
  onSubmit: () => void;
}

export function ReviewForm({ dormId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      dorm_id: dormId,
      user_id: user.id,
      rating,
      comment: comment || null,
      pros: pros ? pros.split(",").map((s) => s.trim()).filter(Boolean) : [],
      cons: cons ? cons.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });

    setLoading(false);
    if (!error) {
      setRating(0);
      setComment("");
      setPros("");
      setCons("");
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold">เขียนรีวิว</h3>

      <div>
        <Label>ให้คะแนน</Label>
        <RatingStars value={rating} onChange={setRating} size="lg" />
        {rating === 0 && <p className="text-sm text-red-500 mt-1">กรุณาให้คะแนน</p>}
      </div>

      <div>
        <Label>ความคิดเห็น</Label>
        <Textarea
          placeholder="เล่าประสบการณ์การอยู่หอนี้..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div>
        <Label>ข้อดี (คั่นด้วยลูกน้ำ ,)</Label>
        <Input
          placeholder="เช่น ใกล้มหาลัย, เงียบสงบ, ที่จอดรถ"
          value={pros}
          onChange={(e) => setPros(e.target.value)}
        />
      </div>

      <div>
        <Label>ข้อเสีย (คั่นด้วยลูกน้ำ ,)</Label>
        <Input
          placeholder="เช่น ราคาแพง, เสียงดัง, ไม่มีที่จอดรถ"
          value={cons}
          onChange={(e) => setCons(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={rating === 0 || loading}>
        {loading ? "กำลังส่ง..." : "ส่งรีวิว"}
      </Button>
    </form>
  );
}
