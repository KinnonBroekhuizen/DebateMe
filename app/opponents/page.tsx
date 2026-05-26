"use client";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import {useEffect, useState} from 'react';

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
        <h2 className="text-6xl font-extrabold mb-10 text-[var(--text)]">
          Select your opponent
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {opponents.map((opponent) => (
            <Link
              key={opponent.id}
              href={`/chat/${opponent.id}`}
              className="flex flex-col p-2 text-left rounded-xl overflow-hidden transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 bg-[var(--surface)] shadow-sm"
            >
              {/* Fixed-size image */}
              <div className="w-full h-120 overflow-hidden">
                <img
                  src={opponent.image}
                  alt={opponent.name}
                  className="w-full h-full object-cover object-top rounded-xl"
                />
              </div>

              {/* Card body */}
              <div className="p-3">
                <p className="font-bold text-3xl text-[var(--text)] leading-snug">
                  {opponent.name}
                </p>
                <p className="text-xl mt-1 text-[var(--muted)] leading-snug">
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
