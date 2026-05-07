import { Clock, HelpCircle, FileText } from "react-feather";
import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <main className="px-10 pt-16 pb-12 max-w-5xl flex justify-evenly">
        {/* Left Side */}
        <div className="">
          <h2 className="text-6xl font-extrabold text-black leading-tight mb-6">
            Debate with political people <br /> who shape nations.
          </h2>
          <p className="text-xl text-gray-700 mb-16 max-w-xl leading-relaxed">
            Challenge Christopher Luxon and other political leaders on the
            issues that define our generations. This is where real debate
            happens.
          </p>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <Link
              href="/opponents"
              className="font-semibold px-6 py-3 rounded-md transition-opacity hover:opacity-90"
              style={{
                background: "var(--primary)",
                color: "black",
              }}
            >
              Start Debating
            </Link>
            <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-md transition-colors">
              View On Github
            </button>
          </div>
        </div>

        <div></div>
      </main>

      {/* Features Section */}
      <section className="px-10 pt-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-45 max-w-9xl mx-auto bg-[var(--primary)] p-10 rounded-md">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="rounded-md p-4 w-50 h-40 flex items-center justify-center">
              <Clock color="black" size={120} />
            </div>
            <p className="text-2xl font-semibold text-black leading-snug">
              Challenge Christopher Luxon and other political leaders in real
              time.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="p-4 w-50 h-40 flex items-center justify-center">
              <HelpCircle color="black" size={120} />
            </div>
            <p className="text-2xl font-semibold text-black leading-snug">
              Your questions shape the conversation and hold leaders
              accountable.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="rounded-md p-4 w-50 h-40 flex items-center justify-center">
              <FileText color="black" size={120} />
            </div>
            <p className="text-2xl font-semibold text-black leading-snug">
              Watch unscripted exchanges where ideas collide and truth emerges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
