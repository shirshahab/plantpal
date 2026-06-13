import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { configureRevenueCat, loginRevenueCat } from "@/lib/revenuecat";

/** Initializes RevenueCat on app startup and links Supabase user ID. */
export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    void configureRevenueCat(user?.id);
  }, []);

  useEffect(() => {
    if (user?.id) {
      void loginRevenueCat(user.id);
    }
  }, [user?.id]);

  return children;
}
