import {getCurrentWindow} from "@tauri-apps/api/window"
import Logo from "@/assets/treetech_green.png";
import { useGlobal } from "@/store/useGlobal";
import { Cable, Loader, Unplug } from "lucide-react";
const appWindow = getCurrentWindow();

export function CustomTitleBar() {
  const { isConnecting, isConnected } = useGlobal();
  return (
    <div data-tauri-drag-region className=" bg-card/40 w-full flex items-center justify-between py-2 px-2">
      <img src={Logo} alt="Logo" className="h-4" />
      <div className=" flex gap-1 items-center justify-center ">
      <span className="text-xs ">  Treetech - Parameter Tool - </span>
        {
          isConnecting ? ( <span className="text-yellow-400/50"> <Loader size={14} className="animate-spin" /></span>) :
          isConnected ? ( <span className="text-green-400/50">  <Cable size={14} /></span>) :
          ( <span className="text-muted-foreground"> <Unplug size={14} /> </span>)
        }

      </div>
      <ul className="flex gap-2">
        <li className="size-3 bg-yellow-400 rounded-full cursor-pointer" onClick={() => {appWindow.minimize()}}></li>
        <li className="size-3 bg-blue-400 rounded-full cursor-pointer" onClick={() => {appWindow.toggleMaximize()}}></li>
        <li className="size-3 bg-red-400 rounded-full cursor-pointer" onClick={() => {appWindow.close()}}></li>
      </ul>
    </div>
  );
}