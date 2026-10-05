import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type WholesaleTerms = {
  product_id: string;
  pack_price: number;
  pack_size: number;
  min_packs: number;
  pack_description: string;
};

export const PACK_LABEL = "پک جور";
export const WHOLESALE_MIN_ORDER = 5_000_000;

export const APP_STATUS: Record<string, string> = {
  pending: "در حال بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

/** Wholesale pack terms — only readable by approved wholesale buyers and admins (RLS). */
export function useWholesale() {
  const { user, isWholesale, isAdmin } = useAuth();
  const enabled = !!user && (isWholesale || isAdmin);
  const query = useQuery({
    queryKey: ["wholesale-terms", user?.id ?? null],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_wholesale").select("*");
      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.product_id, row as WholesaleTerms]));
    },
  });
  return {
    canBuyWholesale: !!user && isWholesale,
    terms: enabled ? (query.data ?? new Map<string, WholesaleTerms>()) : new Map<string, WholesaleTerms>(),
  };
}
