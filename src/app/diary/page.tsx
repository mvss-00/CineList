import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DiaryContent } from "./DiaryContent";
import type { EntryWithMedia } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Мой дневник — CineList" };

export default async function DiaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/diary");

  const { data: rawEntries } = await supabase
    .from("entries")
    .select("*, media:media(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const entries = (rawEntries ?? []) as unknown as EntryWithMedia[];

  return <DiaryContent entries={entries} userId={user.id} />;
}
