import {createFileRoute} from '@tanstack/react-router'
import Fret from "@/components/frets/Fret.tsx";

export const Route = createFileRoute('/')({component: App})

function App() {
    return (
        <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
            <Fret />
            <section className="relative py-20 px-6 text-center overflow-hidden">
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </p>
            </section>
        </div>
    )
}
