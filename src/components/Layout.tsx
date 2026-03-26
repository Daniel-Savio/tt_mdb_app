import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { CustomTitleBar } from "./CustomTitleBar";

export function Layout() {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomTitleBar/>
      <Header />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
