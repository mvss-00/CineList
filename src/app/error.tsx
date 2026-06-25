"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Что-то пошло не так</h2>
        <p className="text-sm text-[#6b7280] font-mono">{error.digest}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#e11d2a] text-white rounded-lg text-sm hover:bg-[#c41a25]"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
