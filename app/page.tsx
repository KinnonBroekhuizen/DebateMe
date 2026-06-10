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
      <main className="px-10 pt-9 md:pt-19">
        {/* Left Side */}
        <div className="">
          <h2 className="lg:text-6xl text-2xl font-extrabold text-[var(--text)] leading-tight mb-2 md:mb-6 animate-fade-down animate-once animate-ease-out">
            Debate with political people <br /> who shape nations.
          </h2>
          <p className="lg:text-2xl text-sm sm:leading-6 text-[var(--muted)] mb-9 md:mb-16 max-w-xl lg:leading-8 animate-fade-down animate-once animate-ease-out animate-delay-500">
            Challenge Christopher Luxon and other political leaders on the
            issues that define our generations. This is where real debate
            happens.
          </p>

          {/* Buttons */}
          <div className="justify-end flex lg:flex-row flex-col md:gap-6 gap-2 text-[var(--text-alt)]">
            <Link
              href="/opponents"
              className="p-7 flex justify-between flex-row items-center gap-5 rounded-md transition-shadow hover:shadow-[0_15px_30px_0_var(--muted-accent)] duration-700 ease-in-out max-w-120 max-h-25 bg-[var(--accent)]"
            >
              <MessageSquare size={100} />
              <div>
                <span className="font-bold text-2xl pb-10">Start Debating</span>
                <p className="md:text-md text-sm/2 leading-snug opacity-80">
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
                <span className="font-bold text-2xl">Add Opponent</span>
                <p className="md:text-md text-sm leading-snug opacity-80">
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
        <div className="flex md:flex-row flex-col gap-2 md:gap-45 mx-auto bg-[var(--surface)] p-10 rounded-md text-[var(--text)] text-[var(--text-alt)]">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="rounded-md p-4 w-50 h-40 flex items-center justify-center">
              <Clock size={120} />
            </div>
            <p className="text-2xl font-semibold leading-snug">
              Challenge Christopher Luxon and other political leaders in real
              time.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="p-4 w-50 h-40 flex items-center justify-center">
              <HelpCircle size={120} />
            </div>
            <p className="text-2xl font-semibold leading-snug">
              Your questions shape the conversation and hold leaders
              accountable.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="rounded-md p-4 w-50 h-40 flex items-center justify-center">
              <FileText size={120} />
            </div>
            <p className="text-2xl font-semibold  leading-snug">
              Watch unscripted exchanges where ideas collide and truth emerges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
