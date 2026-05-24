"use client";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import {useEffect, useState} from 'react';
// const opponents = [
//   {
//     id: "Luxon",
//     name: "Christopher Luxon",
//     description: "NZ's Prime Minister and Leader of the National Party",
//     image:
//       "https://cdn.britannica.com/80/269080-050-C6EA1EB3/New-Zealand-Prime-Minister-Christopher-Luxon.jpg",
//   },
//   {
//     id: "Trump",
//     name: "Donald Trump",
//     description: "45th & 47th President of the USA. Republican",
//     image:
//       "https://www.whitehouse.gov/wp-content/uploads/2025/01/Donald-J-Trump.jpg",
//   },
//   {
//     id: "Hipkins",
//     name: "Christopher Hipkins",
//     description: "Leader of the Labour Party",
//     image:
//       "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQStid5x7f9DB1XLn6ns-9bGDNPmMefuqpkizlAPio1W24lordheBGlrVq1grYAGjEiOeF_DodSScT5HCw",
//   },
//   {
//     id: "Seymour",
//     name: "David Seymour",
//     description: "Leader of the ACT party",
//     image:
//       "https://www.beehive.govt.nz/sites/default/files/styles/portrait_image/public/2025-05/headshot_David-Seymour_2.jpg?itok=59JJMpZ7",
//   },
//   {
//     id: "Peters",
//     name: "Winston Peters",
//     description: "Leader of NZ First",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdk4-gf-aokhWIS5JOox9reyi_N2b_BTPUyw&s",
//   },
// ];


export default function OpponentsPage() {
  type Opponent = {
    id: string;
    name: string;
    description: string;
    image: string;
  }
  const [opponents, setOpponents] = useState<Opponent[]>([]);

  useEffect(() => {
    const fetchOpponents = async () => {
      const { data, error } = await supabase
        .from("ChatIdentifiers")
        .select("id, opponent_name, Information, image_link");

      if (error) {
        console.error("Error fetching opponents:", error);
        return;
      }

      // Map the DB columns to the shape your UI expects
      const mapped = data.map((row) => ({
        id: row.id,
        name: row.opponent_name,
        description: row.Information,
        image: row.image_link,
      }));

      setOpponents(mapped);
    };

    fetchOpponents();
  }, []);
  return (
    <div className="min-h-screen font-sans">
      <main className="px-10 pt-10 pb-20">
        <h2 className="text-6xl font-extrabold mb-10 text-black">
          Select your opponent
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in-down">
          {opponents.map((opponent) => (
            <Link
              key={opponent.id}
              href={`/chat/${opponent.id}`}
              className="flex flex-col text-left rounded-xl overflow-hidden transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--card)] shadow-sm"
            >
              {/* Fixed-size image */}
              <div className="w-full h-90 overflow-hidden">
                <img
                  src={opponent.image}
                  alt={opponent.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Card body */}
              <div className="p-3">
                <p className="font-bold text-3xl text-black leading-snug">
                  {opponent.name}
                </p>
                <p className="text-xl mt-1 text-gray-800 leading-snug">
                  {opponent.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
