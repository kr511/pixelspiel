"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("../game/Game").then((module) => module.Game), { ssr: false, loading: () => <div className="loading-screen"><span>F × E</span><p>Die Welt entsteht …</p></div> });

export default function Home() { return <Game />; }
