import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Search,
} from "lucide-react";
import { RawJsonReading } from "@/pages/Readings";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface TreeItem {
  name: string;
  children: TreeItem[];
  data?: RawJsonReading;
}

interface CascadeViewProps {
  data: RawJsonReading[];
  onSelect?: (item: RawJsonReading) => void;
}

export function CascadeView({ data, onSelect }: CascadeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter((reading) => {
      const desc = reading["Descrição pt"]?.toLowerCase() || "";
      const uuid = reading.UUID.toLowerCase();
      return desc.includes(lowerTerm) || uuid.includes(lowerTerm);
    });
  }, [data, searchTerm]);

  const buildTree = (readings: RawJsonReading[]): TreeItem[] => {
    const root: TreeItem[] = [];

    readings.forEach((reading) => {
      const pathStr = reading["Display pt"]?.trim() || "Geral";
      // Split por barra invertida ou barra normal, removendo partes vazias
      const parts = pathStr.split(/[\\\/]/).filter(Boolean);
      let currentLevel = root;

      parts.forEach((part) => {
        let existingNode = currentLevel.find(
          (node) => node.name === part && !node.data,
        );

        if (!existingNode) {
          existingNode = {
            name: part,
            children: [],
          };
          currentLevel.push(existingNode);
        }

        currentLevel = existingNode.children;
      });

      // Adiciona o item real como uma folha dentro da última pasta encontrada/criada
      currentLevel.push({
        name: reading["Descrição pt"] || reading.UUID,
        children: [],
        data: reading,
      });
    });

    return root;
  };

  const treeData = useMemo(() => buildTree(filteredData), [filteredData]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por descrição..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[60vh] w-full border rounded-md p-4">
        <div className="space-y-1">
          {treeData.length > 0 ? (
            treeData.map((node, index) => (
              <TreeNode
                key={`${node.name}-${index}`}
                node={node}
                onSelect={onSelect}
                depth={0}
                isSearchActive={!!searchTerm.trim()}
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum item encontrado
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

interface TreeNodeProps {
  node: TreeItem;
  onSelect?: (item: RawJsonReading) => void;
  depth: number;
  isSearchActive?: boolean;
}

function TreeNode({ node, onSelect, depth, isSearchActive }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const hasData = !!node.data;

  // Se a pesquisa estiver ativa, mantemos as pastas abertas por padrão
  useEffect(() => {
    if (isSearchActive && hasChildren) {
      setIsOpen(true);
    } else if (!isSearchActive) {
      setIsOpen(false);
    }
  }, [isSearchActive, hasChildren]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    if (hasData && onSelect) {
      onSelect(node.data!);
    } else if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  // Verifica se o nome já é a descrição para não repetir na interface
  const showExtraInfo =
    hasData &&
    node.data?.["Descrição pt"] &&
    node.name !== node.data["Descrição pt"];

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded-sm cursor-pointer transition-colors ${
          hasData
            ? "hover:bg-accent hover:text-accent-foreground"
            : "hover:bg-muted/50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
      >
        <span
          className="mr-1 p-0.5 rounded-md hover:bg-accent"
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4" />
          )}
        </span>
        <span className="mr-2 text-primary shrink-0">
          {hasChildren ? (
            <Folder className={`h-4 w-4 ${isOpen ? "fill-primary/20" : ""}`} />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
        <span
          className={`text-sm truncate ${hasData ? "font-medium" : "text-muted-foreground font-normal"}`}
        >
          {node.name}
          {showExtraInfo && (
            <span className="ml-1 text-xs text-muted-foreground italic">
              ({node.data?.["Descrição pt"]?.slice(13)})
            </span>
          )}
        </span>
      </div>

      {isOpen && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.name}-${index}`}
              node={child}
              onSelect={onSelect}
              depth={depth + 1}
              isSearchActive={isSearchActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
