"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f5f5]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#e11d2a] rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Cine<span className="text-[#e11d2a]">List</span></span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Восстановление пароля</h1>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-[#1a1a1a] font-medium">Письмо отправлено!</p>
              <p className="text-sm text-[#6b7280]">
                Проверьте почту <strong>{email}</strong> и перейдите по ссылке для сброса пароля.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#6b7280] text-center">
                Введите email — мы отправим ссылку для сброса пароля.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отправить ссылку"}
                </Button>
              </form>
              <Link href="/auth/login" className="flex items-center justify-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a]">
                <ArrowLeft className="w-3 h-3" />
                Вернуться к входу
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
