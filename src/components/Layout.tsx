import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { CustomTitleBar } from "./CustomTitleBar";
import BG from "@/assets/bg.png";

export function Layout() {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomTitleBar/>
      <Header />
      <main className="flex-1 p-6 bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }}>
        <Outlet />
      </main>
    </div>
  );
}
