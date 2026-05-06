import Link from "next/link";

const opponents = [
  {
    id: 1,
    name: "Christopher Luxon",
    description: "NZ's Minister and Leader of the National Party",
    image: null,
  },
  {
    id: 2,
    name: "Donald Trump",
    description: "45th & 47th President of the USA. Republican",
    image: null,
  },
  {
    id: 3,
    name: "David Seymour",
    description: "Leader of the ACT party",
    image: null,
  },
  {
    id: 4,
    name: "Winston Peters",
    description: "Leader of NZ First",
    image: null,
  },
  {
    id: 5,
    name: "Chloe Swarbrick",
    description: "Green Party Co-Leader",
    image: null,
  },
  {
    id: 6,
    name: "Christopher Luxon",
    description: "NZ's Minister and Leader of the National Party",
    image: null,
  },
  {
    id: 7,
    name: "Donald Trump",
    description: "45th & 47th President of the USA. Republican",
    image: null,
  },
  {
    id: 8,
    name: "David Seymour",
    description: "Leader of the ACT party",
    image: null,
  },
  {
    id: 9,
    name: "Winston Peters",
    description: "Leader of NZ First",
    image: null,
  },
  {
    id: 10,
    name: "Chloe Swarbrick",
    description: "Green Party Co-Leader",
    image: null,
  },
];

export default function OpponentsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header
        style={{ background: "var(--navbar)" }}
        className="px-8 py-6 border-b-2 border-black"
      >
        <Link
          href="/"
          className="text-4xl font-bold underline"
          style={{ color: "var(--navbar-foreground)" }}
        >
          Debate Me
        </Link>
      </header>

      {/* Page Title */}
      <main className="px-10 pt-10 pb-20">
        <h2
          className="text-6xl font-extrabold mb-10"
          style={{ color: "var(--foreground)" }}
        >
          Select your Opponent:
        </h2>

        {/* Opponent Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {opponents.map((opponent) => (
            <button
              key={opponent.id}
              className="flex flex-col text-left hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
              style={
                { "--tw-ring-color": "var(--accent)" } as React.CSSProperties
              }
            >
              {/* Photo placeholder */}
              <div
                className="w-full h-48 mb-1 rounded-sm"
                style={{ background: "var(--border)" }}
              />
              {/* Name + description */}
              <p
                className="text-lg font-bold leading-snug"
                style={{ color: "var(--foreground)" }}
              >
                {opponent.name}:{" "}
                <span className="font-semibold">{opponent.description}</span>
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
