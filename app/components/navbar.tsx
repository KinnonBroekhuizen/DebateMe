import Link from "next/link";

export default function NavBar() {
  return (
    <header className="px-8 py-5 bg-[var(--primary)]">
      <Link href="/" className="text-2xl font-bold text-black ">
        Debate me.
      </Link>
    </header>
  );
}
