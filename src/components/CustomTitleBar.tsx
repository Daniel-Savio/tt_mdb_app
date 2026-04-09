import {getCurrentWindow} from "@tauri-apps/api/window"
import Logo from "@/assets/treetech_green.png";
import { useGlobal } from "@/store/useGlobal";
const appWindow = getCurrentWindow();

export function CustomTitleBar() {
  const { setConnecting, isConnecting, setConnected, isConnected, setReading, isReading } = useGlobal();
  return (
    <div data-tauri-drag-region className="w-full bg-background flex items-center justify-between py-2 px-2">
      <img src={Logo} alt="Logo" className="h-4" />
      <h1 className="text-xs  text-muted-foreground">
        Treetech - Parameter Tool


        {
          isConnecting ? ( <span className="text-yellow-400/50"> - Connecting...</span>) :
          isConnected ? ( <span className="text-green-400/50"> - Connected</span>) :
          ( <span className="text-red-400/50"> - Disconnected</span>)
        }

      </h1>
      <ul className="flex gap-2">
        <li className="size-3 bg-yellow-400 rounded-full cursor-pointer" onClick={() => {appWindow.minimize()}}></li>
        <li className="size-3 bg-blue-400 rounded-full cursor-pointer" onClick={() => {appWindow.toggleMaximize()}}></li>
        <li className="size-3 bg-red-400 rounded-full cursor-pointer" onClick={() => {appWindow.close()}}></li>
      </ul>
    </div>
  );
}