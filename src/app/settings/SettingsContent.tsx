"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface SettingsContentProps {
  profile: Profile;
  userId: string;
}

export function SettingsContent({ profile, userId }: SettingsContentProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимум 5 МБ", variant: "destructive" });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return avatarUrl || null;
    setUploadingAvatar(true);

    const supabase = createClient();
    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
      setUploadingAvatar(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setUploadingAvatar(false);
    return publicUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Имя пользователя не может быть пустым", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Upload avatar if changed
    const newAvatarUrl = await uploadAvatar();

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: newAvatarUrl,
      } as never)
      .eq("id", userId);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Имя занято", description: "Это имя уже используется", variant: "destructive" });
      } else {
        toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
      }
    } else {
      if (newAvatarUrl) setAvatarUrl(newAvatarUrl);
      setAvatarPreview(null);
      setAvatarFile(null);
      toast({ title: "Профиль обновлён" });
      router.refresh();
    }
    setSaving(false);
  }

  const displayAvatar = avatarPreview || avatarUrl || undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-6 h-6 text-[#e11d2a]" />
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Настройки профиля</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              {displayAvatar ? (
                <AvatarImage src={displayAvatar} alt={username} />
              ) : null}
              <AvatarFallback className="text-2xl">{getInitials(username || "U")}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#e11d2a] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#c41a25] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <div>
            <p className="font-medium text-[#1a1a1a]">Фото профиля</p>
            <p className="text-sm text-[#6b7280]">JPG, PNG или GIF до 5 МБ</p>
            <button
              type="button"
              className="mt-1 text-sm text-[#e11d2a] hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              Загрузить фото
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Имя пользователя</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
            placeholder="cinelover"
            minLength={3}
            pattern="[a-z0-9_]+"
            title="Только строчные буквы, цифры и _"
          />
          <p className="text-xs text-[#6b7280]">Только строчные буквы латиницы, цифры и символ _</p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">О себе</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите немного о себе..."
            rows={4}
            maxLength={300}
          />
          <p className="text-xs text-[#6b7280]">{bio.length}/300</p>
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Сохранение...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Сохранить изменения</>
          )}
        </Button>
      </form>
    </div>
  );
}
