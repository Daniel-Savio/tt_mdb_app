import { 
  Settings2, 
  Trash2, 
  Download, 
  Send,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RawJsonReading } from "@/pages/Readings";

interface ModifiedPoint {
  original: RawJsonReading;
  newValue: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface ChangesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  modifiedPoints: Record<string, ModifiedPoint>;
  onRemove: (uuid: string) => void;
  onExport: () => void;
  onImport: () => void;
  onApply: () => void;
  isApplying: boolean;
}

export function ChangesDrawer({ 
  isOpen, 
  onClose, 
  modifiedPoints, 
  onRemove, 
  onExport, 
  onImport,
  onApply,
  isApplying 
}: ChangesDrawerProps) {
  const pointsArray = Object.values(modifiedPoints);
  const hasChanges = pointsArray.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-100 bg-card border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <header className="p-4 border-b flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-bold">{pointsArray.length} Alterações</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4">
        {hasChanges ? (
          <div className="space-y-4">
            {pointsArray.map((point) => (
              <div key={point.original.UUID} className="text-xs border rounded-md p-3 space-y-2 relative group bg-background/50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(point.original.UUID)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
                
                <div className="font-medium text-primary truncate pr-6 text-wrap">
                  {point.original["Descrição pt"]}
                </div>
                
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground uppercase">Original</span>
                    <span className="line-through">
                        {point.original["Conversão pt"] ? 
                            point.original["Valor default"] : 
                            (Number(point.original["Valor default"]) / Number(point.original["Divisor"] || 1))}
                    </span>
                  </div>
                  <div className="h-4 w-[1px] bg-border mx-2" />
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground uppercase">Novo</span>
                    <span className="font-bold">{point.newValue}</span>
                  </div>
                </div>

                {point.status === 'success' && (
                  <div className="text-[10px] text-green-500 font-medium">✓ Atualizado com sucesso</div>
                )}
                {point.status === 'error' && (
                  <div className="text-[10px] text-destructive font-medium">✗ {point.error || 'Erro ao atualizar'}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-20 text-center">
            <Settings2 className="h-12 w-12 mb-4 opacity-20" />
            <p>Nenhuma alteração pendente</p>
          </div>
        )}
      </ScrollArea>

      <footer className="p-4 border-t bg-muted/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={onExport}
            disabled={isApplying}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={onImport}
            disabled={isApplying}
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </div>
        <Button 
          className="w-full justify-start gap-2 font-bold"
          disabled={!hasChanges || isApplying}
          onClick={onApply}
        >
          <Send className="h-4 w-4" />
          {isApplying ? "Aplicando..." : "Aplicar Alterações"}
        </Button>
      </footer>
    </div>
  );
}
