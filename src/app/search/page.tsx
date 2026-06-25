import { Suspense } from "react";
import { SearchContent } from "./SearchContent";

export const metadata = { title: "Поиск — CineList" };

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <Suspense>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
