import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";
import { Redirect } from "wouter";

export function AppLayout({ children }: { children: ReactNode }) {
  const { role } = useAuth();

  if (!role) {
    return <Redirect href="/" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-64 h-screen overflow-y-auto mt-16 md:mt-0 relative grid-bg terminal-scroll">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 to-background/50 pointer-events-none -z-10" />
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
