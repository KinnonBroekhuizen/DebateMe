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
];

export default function OpponentsPage() {
  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Page Title */}
      <main className="px-10 pt-10 pb-20">
        <h2
          className="text-6xl font-extrabold mb-10"
          style={{ color: "var(--foreground)" }}
        >
          Select your Opponent
        </h2>

        {/* Opponent Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {opponents.map((opponent) => (
            <button
              key={opponent.id}
              className="flex flex-col text-left rounded-md transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={
                { "--tw-ring-color": "var(--accent)" } as React.CSSProperties
              }
            >
              {/* Photo placeholder */}
              <div
                className="w-full h-48 mb-2 rounded-sm"
                style={{ background: "var(--muted)" }}
              />
              {/* Name */}
              <p
                className="text-base font-bold leading-snug"
                style={{ color: "var(--foreground)" }}
              >
                {opponent.name}:{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {opponent.description}
                </span>
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
