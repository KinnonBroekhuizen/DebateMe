import Link from "next/link";

export default function NavBar() {
  return (
    <header className="px-8 py-5 bg-[var(--background)]">
      <Link href="/" className="text-2xl font-bold text--back">
        Debate me.
      </Link>
    </header>
  );
}
