"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Loader2, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  userName: string;
  userId: string;
  createdAt: string;
}

interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
}

// ─── Star renderer ────────────────────────────────────────────────────────────

function Stars({
  value,
  size = "sm",
  interactive = false,
  onSelect,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onSelect?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const cls = size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = (interactive ? hovered || value : value) >= i;
        return (
          <Star
            key={i}
            className={`${cls} transition-colors ${
              filled ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onMouseEnter={() => interactive && setHovered(i)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onSelect?.(i)}
          />
        );
      })}
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const initials = review.userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="py-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{review.userName}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <Stars value={review.rating} size="sm" />
          {review.title && (
            <p className="font-semibold text-sm mt-2">{review.title}</p>
          )}
          {review.body && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Write Review Form ────────────────────────────────────────────────────────

function WriteReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/store/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title, body }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => { onSubmitted(); }, 1200);
    } else {
      setError(data.error ?? "Failed to submit review.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium py-4">
        <CheckCircle className="h-4 w-4" />
        Review submitted — thank you!
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Your Rating <span className="text-red-500">*</span></p>
        <Stars value={rating} size="lg" interactive onSelect={setRating} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Review Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={120}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Review</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike? How was the quality?"
          rows={4}
          maxLength={1000}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchReviews = useCallback(() => {
    fetch(`/api/store/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setStats(d.stats ?? null);
      })
      .finally(() => setLoaded(true));
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const alreadyReviewed =
    session && reviews.some((r) => r.userId === session.user.id);

  const average = stats?.average ?? 0;
  const total = stats?.total ?? 0;
  const distribution = stats?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div id="reviews" className="mt-6 bg-white rounded-2xl border p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold">
          Customer Reviews
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({total} {total === 1 ? "review" : "reviews"})
            </span>
          )}
        </h2>
        {session && !alreadyReviewed && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Stats block */}
      {loaded && total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 rounded-xl bg-muted/30 border">
          {/* Big number */}
          <div className="flex flex-col items-center justify-center shrink-0 gap-1">
            <span className="text-5xl font-bold tracking-tight">{average.toFixed(1)}</span>
            <Stars value={Math.round(average)} size="md" />
            <span className="text-xs text-muted-foreground">{total} {total === 1 ? "rating" : "ratings"}</span>
          </div>

          <div className="hidden sm:block w-px bg-border" />

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const cnt = distribution[star] ?? 0;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3 text-right shrink-0">{star}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 shrink-0">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && session && !alreadyReviewed && (
        <>
          <WriteReviewForm
            productId={productId}
            onSubmitted={() => {
              setShowForm(false);
              fetchReviews();
            }}
          />
          <Separator className="my-6" />
        </>
      )}

      {/* Not logged in prompt */}
      {!session && (
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/store/auth" className="text-primary font-medium hover:underline">Sign in</a> to leave a review.
        </p>
      )}

      {/* Already reviewed notice */}
      {alreadyReviewed && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <CheckCircle className="h-4 w-4 text-green-500" />
          You have already reviewed this product.
        </div>
      )}

      {/* Review list */}
      {!loaded && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {loaded && total === 0 && (
        <div className="text-center py-10">
          <Star className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

      {loaded && reviews.length > 0 && (
        <div className="divide-y">
          {reviews.slice(0, visibleCount).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Load more */}
      {visibleCount < reviews.length && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="text-muted-foreground"
          >
            <ChevronDown className="mr-1.5 h-4 w-4" />
            Show more reviews
          </Button>
        </div>
      )}
    </div>
  );
}
