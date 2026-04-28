import { supabase } from '@/lib/supabase'

export default async function Home() {
  const {data,error} = await supabase
  .from('TestingTable')
  .select('*')

  console.log(data, error)
  return (
    <div>
      <main>
        <h1>Debate Me</h1>
        {data?.map((row) => (
          <div key={row.id}>
            <h2>{row.name}</h2>
            <p>{row.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
