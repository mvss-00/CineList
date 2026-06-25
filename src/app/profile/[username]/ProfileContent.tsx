"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, UserCheck, UserPlus, Settings, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS, STATUS_COLORS, getInitials, formatDateShort, cn } from "@/lib/utils";
import { TMDB_POSTER_SM } from "@/types/tmdb";
import type { Profile, EntryWithMedia, EntryStatus } from "@/types/database";

type ProfileEntry = EntryWithMedia;

interface ProfileContentProps {
  profile: Profile;
  entries: ProfileEntry[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  currentUserId: string | null;
}

const CHART_COLORS = ["#e11d2a", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function ProfileContent({
  profile,
  entries,
  followersCount,
  followingCount,
  isFollowing: initialIsFollowing,
  currentUserId,
}: ProfileContentProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followers, setFollowers] = useState(followersCount);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn = currentUserId === profile.id;

  // Stats
  const completed = entries.filter((e) => e.status === "completed");
  const watching = entries.filter((e) => e.status === "watching");
  const planToWatch = entries.filter((e) => e.status === "plan_to_watch");
  const dropped = entries.filter((e) => e.status === "dropped");
  const rated = entries.filter((e) => e.rating);
  const avgRating = rated.length ? (rated.reduce((s, e) => s + (e.rating || 0), 0) / rated.length).toFixed(1) : null;

  // Monthly chart data (last 12 months)
  const monthlyData = (() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const label = d.toLocaleDateString("ru-RU", { month: "short" });
      const count = completed.filter((e) => {
        const date = new Date(e.created_at);
        return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
      }).length;
      return { month: label, count };
    });
  })();

  // Genre distribution
  const genreCount: Record<string, number> = {};
  entries.forEach((e) => {
    e.media.genres.forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });
  const genreData = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Rating distribution
  const ratingDist = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: rated.filter((e) => e.rating === i + 1).length,
  }));

  async function handleFollow() {
    if (!currentUserId) {
      toast({ title: "Требуется авторизация", variant: "destructive" });
      return;
    }
    setFollowLoading(true);
    const supabase = createClient();
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowers((f) => f - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profile.id });
      setIsFollowing(true);
      setFollowers((f) => f + 1);
    }
    setFollowLoading(false);
  }

  const statusGroups: Record<EntryStatus, ProfileEntry[]> = {
    completed,
    watching,
    plan_to_watch: planToWatch,
    dropped,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
          <AvatarFallback className="text-2xl">{getInitials(profile.username)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">{profile.username}</h1>
            {isOwn && (
              <Link href="/settings">
                <Button variant="outline" size="sm" className="h-8">
                  <Settings className="w-3.5 h-3.5 mr-1" /> Настройки
                </Button>
              </Link>
            )}
            {!isOwn && currentUserId && (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                disabled={followLoading}
                className="h-8"
              >
                {followLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isFollowing ? (
                  <><UserCheck className="w-3.5 h-3.5 mr-1" /> Отписаться</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5 mr-1" /> Подписаться</>
                )}
              </Button>
            )}
          </div>

          {profile.bio && (
            <p className="text-[#6b7280] text-sm mb-3">{profile.bio}</p>
          )}

          {/* Social stats */}
          <div className="flex items-center gap-4 text-sm">
            <span><strong className="text-[#1a1a1a]">{followers}</strong> <span className="text-[#6b7280]">подписчиков</span></span>
            <span><strong className="text-[#1a1a1a]">{followingCount}</strong> <span className="text-[#6b7280]">подписок</span></span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Всего", value: entries.length },
            { label: "Просмотрено", value: completed.length },
            { label: "Смотрю", value: watching.length },
            { label: "Ср. оценка", value: avgRating ? `${avgRating}★` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-[#f5f5f5] rounded-xl px-4 py-3">
              <div className="text-xl font-bold text-[#1a1a1a]">{value}</div>
              <div className="text-xs text-[#6b7280]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="lists">
        <TabsList className="mb-6">
          <TabsTrigger value="lists">Списки</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        {/* Lists tab */}
        <TabsContent value="lists">
          <Tabs defaultValue="completed">
            <TabsList className="mb-4">
              {(Object.entries(STATUS_LABELS) as [EntryStatus, string][]).map(([status, label]) => (
                <TabsTrigger key={status} value={status}>
                  {label} ({statusGroups[status].length})
                </TabsTrigger>
              ))}
            </TabsList>
            {(Object.entries(statusGroups) as [EntryStatus, ProfileEntry[]][]).map(([status, group]) => (
              <TabsContent key={status} value={status}>
                {group.length === 0 ? (
                  <div className="text-center py-12 text-[#6b7280]">
                    <p>В этом списке пока пусто</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {group.map((entry) => {
                      const href = entry.media.type === "movie"
                        ? `/media/movie/${entry.media.tmdb_id}`
                        : `/media/tv/${entry.media.tmdb_id}`;
                      return (
                        <Link key={entry.id} href={href} className="group block">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#f5f5f5] shadow-sm group-hover:ring-2 group-hover:ring-[#e11d2a] transition-all">
                            {entry.media.poster_url ? (
                              <Image
                                src={entry.media.poster_url.startsWith("http") ? entry.media.poster_url : `${TMDB_POSTER_SM}${entry.media.poster_url}`}
                                alt={entry.media.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                                <span className="text-white/30 text-xs text-center px-1">{entry.media.title}</span>
                              </div>
                            )}
                            {entry.rating && (
                              <div className="absolute bottom-1 right-1 bg-black/70 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-[#d4af37] text-[#d4af37]" />
                                <span className="text-white text-[10px] font-medium">{entry.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#1a1a1a] line-clamp-2 group-hover:text-[#e11d2a]">
                            {entry.media.title}
                          </p>
                          {entry.media.release_year && (
                            <p className="text-[10px] text-[#6b7280]">{entry.media.release_year}</p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Stats tab */}
        <TabsContent value="stats">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-[#6b7280]">
              <p>Добавьте фильмы, чтобы увидеть статистику</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly views */}
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Просмотры по месяцам</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`${v} просм.`, ""]}
                    />
                    <Bar dataKey="count" fill="#e11d2a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Genre pie */}
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Жанры</h3>
                {genreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {genreData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} тит.`, ""]} contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
                      <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#6b7280" }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[#6b7280] text-center pt-8">Нет данных о жанрах</p>
                )}
              </div>

              {/* Rating distribution */}
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 lg:col-span-2">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Распределение оценок</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ratingDist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} тит.`, ""]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {ratingDist.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.rating >= 8 ? "#22c55e" : entry.rating >= 5 ? "#f59e0b" : "#e11d2a"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
