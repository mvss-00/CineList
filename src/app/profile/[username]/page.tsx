import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "./ProfileContent";
import type { EntryWithMedia } from "@/types/database";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — CineList` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawEntries } = await supabase
    .from("entries")
    .select("*, media:media(*)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const entries = (rawEntries ?? []) as unknown as EntryWithMedia[];

  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", profile.id);

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", profile.id);

  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data: followData } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!followData;
  }

  return (
    <ProfileContent
      profile={profile}
      entries={entries}
      followersCount={followers?.length ?? 0}
      followingCount={following?.length ?? 0}
      isFollowing={isFollowing}
      currentUserId={user?.id ?? null}
    />
  );
}
