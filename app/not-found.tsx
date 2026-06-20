import Link from "next/link";

export default function NotFound() {
  return (
    <main className="panel mx-auto max-w-2xl p-10 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">This story is off the tape.</h1>
      <p className="mt-4 text-slate-300">The page you requested is missing or no longer published.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-200"
      >
        Return to dashboard
      </Link>
    </main>
  );
}
