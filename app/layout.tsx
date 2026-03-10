import { ClerkProvider } from '@clerk/nextjs';
import { AppProvider } from "@/components/app-context";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { ToastContainer } from "@/components/toast-container";
import "./styles/tailwind.css";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./styles/index.css";
import { getLoggedInUser } from '@/lib/actions/user.actions';

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await getLoggedInUser();
  return (
    <ClerkProvider>
    <html lang="en">
      <body>
        <AppProvider initialUser={dbUser}>
          <div className="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              {children} {/* Your page content goes here */}
            </main>
            <BottomNav />
            <ToastContainer />
          </div>
        </AppProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}