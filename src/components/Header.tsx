import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Draftboard
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            Board
          </Link>
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
