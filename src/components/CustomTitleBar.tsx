import {getCurrentWindow} from "@tauri-apps/api/window"
import Logo from "@/assets/treetech_green.png";
const appWindow = getCurrentWindow();

export function CustomTitleBar() {
  return (
    <div data-tauri-drag-region className="w-full bg-background flex items-center justify-between py-2 px-2">
      <img src={Logo} alt="Logo" className="h-4" />
      <h1 className="text-xs  text-muted-foreground">Treetech - Parameter Tool</h1>
      <ul className="flex gap-2">
        <li className="size-3 bg-yellow-400 rounded-full cursor-pointer" onClick={() => {appWindow.minimize()}}></li>
        <li className="size-3 bg-blue-400 rounded-full cursor-pointer" onClick={() => {appWindow.toggleMaximize()}}></li>
        <li className="size-3 bg-red-400 rounded-full cursor-pointer" onClick={() => {appWindow.close()}}></li>
      </ul>
    </div>
  );
}