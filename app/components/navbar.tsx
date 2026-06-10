import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface)] px-8 py-5 shadow-sm shadow-black/20">
      <Link href="/" className="text-xl md:text-2xl font-bold text-white">
        Smokes and Mirrors: Debate me.
      </Link>
    </header>
  );
}
