import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/articles", label: "Articles" }
];

export function AdminShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <p className="eyebrow">Admin Console</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Lightweight editorial tooling for sources, articles, and dashboard content.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
