import Link from 'next/link'
export default async function Home(){
    return(
        <main>
                <header className="flex head-banner items-center px-6 py-4 w-full">
                        {/*Left*/}
                        <h1 className='flex-1'><Link href="../" className="no-underline hover:underline">Debate Me</Link></h1>
                        {/*Center*/}
                        <h1 className="text-center text-lg flex-1 flex justify-center">[ Chat Name]</h1>
                        {/*Right*/}
                        <div className="flex-1 flex justify-end">
                            <button className="bg-gray-500 text-white px-4 py-2 rounded">New Chat</button>
                        </div>
                </header>
        </main>
    )
}