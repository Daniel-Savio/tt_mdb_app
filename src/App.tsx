import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMaps } from "./store/useMaps";
import { useLanguage } from "./store/useLanguage";

import { invoke } from "@tauri-apps/api/core";
import { Layout } from "./components/Layout";
import { Connect } from "./pages/Connect";
import { Readings } from "./pages/Readings";
import { Settings } from "./pages/Settings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./App.css";
import { useEffect } from "react";
import { toast } from "sonner";

function App() {
  const setIeds = useMaps((state: any) => state.setIeds);
  const lang = useLanguage((state) => state.language);

  const { data, error, isSuccess, isError } = useQuery({
    queryKey: ["maps"],
    queryFn: async () => {
      const response = await invoke("get_maps");
      const result = response as { maps: string; err: boolean };
      if (result.err) {
        throw new Error(result.maps);
      }
      return JSON.parse(result.maps);
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isSuccess && data) {
      setIeds(data);
      toast.success(
        lang === "pt-br"
          ? "Mapas carregados com sucesso!"
          : "Maps loaded successfully!"
      );
    }
  }, [isSuccess, data, setIeds, lang]);

  useEffect(() => {
    if (isError && error) {
      toast.error(
        lang === "pt-br"
          ? "Falha ao carregar mapas: " + error.message
          : "Failed to load maps: " + error.message
      );
    }
  }, [isError, error, lang]);

  return (
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Connect />} />
            <Route path="readings" element={<Readings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
