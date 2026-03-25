import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "./components/ui/button";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="bg-background min-h-screen flex flex-col items-center justify-center">
      <p>teste</p>
      <Button onClick={greet}>Greet</Button>
      {greetMsg && <p>{greetMsg}</p>}
    </main>
  );
}

export default App;
