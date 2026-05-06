import { Clock, HelpCircle, FileText } from "react-feather";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <main className="px-10 pt-16 pb-12 max-w-5xl">
        <h2 className="text-6xl font-extrabold text-black leading-tight mb-6">
          Debate with political people <br /> who shape nations.
        </h2>
        <p className="text-xl text-gray-700 mb-16 max-w-xl leading-relaxed">
          Challenge Christopher Luxon and other political leaders on the issues
          that define our generations. This is where real debate happens.
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href="/opponents"
            className="font-semibold px-6 py-3 rounded-md transition-opacity hover:opacity-90"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Start Debating
          </Link>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-md transition-colors">
            Learn More
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section className="px-10 pt-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-25 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="bg-black rounded-full p-5 w-20 h-20 flex items-center justify-center">
              <Clock color="white" size={36} />
            </div>
            <p className="text-xl font-semibold text-black leading-snug">
              Challenge Christopher Luxon and other political leaders in real
              time.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex items-center justify-center w-20 h-20">
              <HelpCircle color="black" size={64} />
            </div>
            <p className="text-xl font-semibold text-black leading-snug">
              Your questions shape the conversation and hold leaders
              accountable.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="border-2 border-black rounded-md p-4 w-20 h-20 flex items-center justify-center">
              <FileText color="black" size={36} />
            </div>
            <p className="text-xl font-semibold text-black leading-snug">
              Watch unscripted exchanges where ideas collide and truth emerges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
