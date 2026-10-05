import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/catalog";
import { useWholesale } from "@/lib/wholesale";

export type CartLine = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  /** Wholesale assorted pack line; quantity = number of packs. */
  pack?: boolean;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hasPacks: boolean;
  unitPrice: (line: CartLine) => number;
  add: (line: CartLine) => void;
  setQuantity: (index: number, quantity: number) => void;
  remove: (index: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "sandeh-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { data: catalog } = useQuery({ ...catalogQuery, staleTime: 60_000 });
  const { terms } = useWholesale();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((current) => {
      const index = current.findIndex(
        (l) =>
          l.productId === line.productId && l.size === line.size && l.color === line.color && !!l.pack === !!line.pack,
      );
      if (index === -1) return [...current, line];
      return current.map((l, i) =>
        i === index ? { ...l, quantity: l.quantity + line.quantity } : l,
      );
    });
  }, []);

  const setQuantity = useCallback((index: number, quantity: number) => {
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, quantity: Math.max(1, Math.min(line.pack ? 200 : 20, quantity)) } : line,
      ),
    );
  }, []);

  const remove = useCallback((index: number) => {
    setLines((current) => current.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const unitPrice = (line: CartLine) => {
      if (line.pack) return terms.get(line.productId)?.pack_price ?? 0;
      return catalog?.find((p) => p.id === line.productId)?.price ?? 0;
    };
    const subtotal = lines.reduce((sum, line) => sum + unitPrice(line) * line.quantity, 0);
    return {
      lines,
      hasPacks: lines.some((l) => l.pack),
      unitPrice,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, catalog, terms, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}