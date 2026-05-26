import Link from "next/link";

export default function NavBar() {
  return (
    <header className="px-8 py-5 bg-[var(--surface)]">
      <Link href="/" className="text-2xl font-bold text-[var(--text)]">
        Smokes and Mirrors: Debate me.
      </Link>
    </header>
  );
}
