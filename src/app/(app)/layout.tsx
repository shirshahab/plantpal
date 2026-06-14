import { AuthProvider } from "@/lib/store/auth-provider";
import { AuthSessionGate } from "@/components/auth/auth-session-gate";
import { ProtectedAppProviders } from "@/components/auth/protected-app-providers";
import { GlobalErrorHandler } from "@/components/errors/global-error-handler";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GlobalErrorHandler>
        <AuthSessionGate>
          <ProtectedAppProviders>{children}</ProtectedAppProviders>
        </AuthSessionGate>
      </GlobalErrorHandler>
    </AuthProvider>
  );
}
