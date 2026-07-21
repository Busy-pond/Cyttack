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
      <main className="flex-1 md:ml-64 h-screen overflow-y-auto mt-16 md:mt-0 surface-scroll">
        <div className="container mx-auto px-6 py-8 md:px-10 md:py-10 max-w-7xl animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
