'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profileData) {
          router.push('/login');
          return;
        }

        setProfile(profileData);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [supabase, router, setProfile, setLoading]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] space-y-4">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">Initializing ClassSync...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex">
      {/* Sonner Toast Notifier */}
      <Toaster position="top-right" theme="dark" closeButton />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-8 pt-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
