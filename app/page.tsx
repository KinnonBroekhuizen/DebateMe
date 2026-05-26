import {
  Clock,
  HelpCircle,
  FileText,
  MessageSquare,
  UserPlus,
} from "react-feather";
import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      <main className="px-10 pt-16 pb-12">
        {/* Left Side */}
        <div className="">
          <h2 className="text-6xl font-extrabold text-[var(--text)] leading-tight mb-6 animate-fade-down animate-once animate-ease-out">
            Debate with political people <br /> who shape nations.
          </h2>
          <p className="text-2xl text-[var(--muted)] mb-16 max-w-xl leading-8 animate-fade-down animate-once animate-ease-out animate-delay-500">
            Challenge Christopher Luxon and other political leaders on the
            issues that define our generations. This is where real debate
            happens.
          </p>

          {/* Buttons */}
          <div className="justify-end flex gap-4">
            <Link
              href="/opponents"
              className="p-7 flex justify-between flex-row items-center gap-5 rounded-md transition-opacity hover:opacity-90 max-w-120 max-h-25 bg-[var(--accent)]"
            >
              <MessageSquare size={100} />
              <div>
                <span className="font-bold text-xl pb-10">Start Debating</span>
                <p className="text-md leading-snug opacity-80">
                  Go head-to-head with a political leader. Pick your opponent
                  and make your case in real time.
                </p>
              </div>
            </Link>

            <Link
              href="/addOpponent"
              className="p-7 flex justify-between flex-row items-center gap-5 rounded-md transition-opacity hover:opacity-90 max-w-120 max-h-25 bg-[var(--muted-accent)]"
            >
              <UserPlus size={100} />
              <div>
                <span className="font-bold text-xl">Add Opponent</span>
                <p className="text-md leading-snug opacity-80">
                  Know a leader missing from the list? Submit them and bring
                  them into the arena.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="px-10 pt-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-45 max-w-9xl mx-auto bg-[var(--surface)] p-10 rounded-md">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="rounded-md p-4 w-50 h-40 flex items-center justify-center">
              <Clock color="var(--text)" size={120} />
            </div>
            <p className="text-2xl font-semibold text-[var(--text)] leading-snug">
              Challenge Christopher Luxon and other political leaders in real
              time.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="p-4 w-50 h-40 flex items-center justify-center">
              <HelpCircle color="var(--text)" size={120} />
            </div>
            <p className="text-2xl font-semibold text-[var(--text)] leading-snug">
              Your questions shape the conversation and hold leaders
              accountable.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="rounded-md p-4 w-50 h-40 flex items-center justify-center">
              <FileText color="var(--text)" size={120} />
            </div>
            <p className="text-2xl font-semibold text-[var(--text)] leading-snug">
              Watch unscripted exchanges where ideas collide and truth emerges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
