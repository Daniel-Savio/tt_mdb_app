import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FileText } from "lucide-react";
import { RawJsonReading } from "@/pages/Readings";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  const buildTree = (readings: RawJsonReading[]): TreeItem[] => {
    const root: TreeItem[] = [];


    readings.forEach((reading) => {
      const pathStr = reading["Display pt"] || "";
      if (!pathStr) return;

      const parts = pathStr.split("\\");
      let currentLevel = root;

      parts.forEach((part, index) => {
        let existingNode = currentLevel.find((node) => node.name === part);

        if (!existingNode) {
          existingNode = {
            name: part,
            children: [],
          };
          currentLevel.push(existingNode);
        }

        if (index === parts.length - 1) {
          existingNode.data = reading;
        }

        currentLevel = existingNode.children;
      });
    });

    return root;
  };

  const treeData = buildTree(data);

  return (
    <ScrollArea className="h-[450px] w-full border rounded-md p-4">
      <div className="space-y-1">
        {treeData.map((node) => (
          <TreeNode key={node.name} node={node} onSelect={onSelect} depth={0} />
        ))}
      </div>
       <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface TreeNodeProps {
  node: TreeItem;
  onSelect?: (item: RawJsonReading) => void;
  depth: number;
}

function TreeNode({ node, onSelect, depth }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const hasData = !!node.data;

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

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded-sm cursor-pointer transition-colors ${
          hasData ? "hover:bg-accent hover:text-accent-foreground" : "hover:bg-muted/50"
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
        <span className={`text-sm truncate ${hasData ? "font-medium" : "text-muted-foreground font-normal"}`}>
          {node.name} {hasData && <span className="ml-1 text-xs text-muted-foreground">({node.data?.["Descrição pt"]?.slice(13)})</span>}
        </span>
      </div>

      {isOpen && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
