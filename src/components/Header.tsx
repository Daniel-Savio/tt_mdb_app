import { Link } from "react-router-dom";
import Logo from "@/assets/treetech_green.png";
import { useLanguage } from "@/store/useLanguage";
import BrFlag from "@/assets/br-logo.png";
import UsaFlag from "@/assets/usa-logo.png";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
export function Header() {
  const lang = useLanguage((state) => state.language);


  function changeLanguage(value: string) {
    if (value === 'en-us') {
      useLanguage.getState().setEnglish();
    } else {
      useLanguage.getState().setPortuguese();
    }
  }
  return (
    <>
      <header className="w-full text-foreground px-4 pt-2 flex justify-between items-center">
        <div className="flex gap-4 items-baseline">
        
          <Tabs defaultValue="connect">
            <TabsList className="bg-transparent border-0">
              <TabsTrigger className="text-lg " value="connect">
                <Link to="/" >{lang === 'pt-br' ? 'Conexão' : 'Connection'}</Link>
              </TabsTrigger>
              <TabsTrigger className="text-lg" value="readings">
                <Link to="/readings">{lang === 'pt-br' ? 'Leituras' : 'Readings'}</Link>
              </TabsTrigger>
              <TabsTrigger className="text-lg" value="settings">
                <Link to="/settings" >{lang === 'pt-br' ? 'Parâmetros' : 'Settings'}</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

        </div>
        <Select onValueChange={(value) => changeLanguage(value)} defaultValue={lang}>
          <SelectTrigger className="w-fit flex gap-4 cursor-pointer">
           
            <SelectValue></SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="pt-br"><div className="flex gap-2 items-center"><img src={BrFlag} alt="Brazil Flag" className="h-4" /> <p>Pt-Br</p></div></SelectItem>
              <SelectItem value="en-us"><div className="flex gap-2 items-center"><img src={UsaFlag} alt="USA Flag" className="h-4" /> <p>En-US</p></div></SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </header>
      <Separator className="bg-linear-to-r from-primary to-background" />
    </>
  );
}
