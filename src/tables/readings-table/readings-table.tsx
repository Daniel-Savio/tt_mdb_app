import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  getFilteredRowModel
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import { useLanguage } from "@/store/useLanguage"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    modo: false,
    tratamento: false,
    tabela_modbus: false,
    opcional: false,
    nivel_de_acesso: false,
    limites: false,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  )
  const lang = useLanguage().language

  const table = useReactTable({
    data,
    columns,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnVisibility,
      columnFilters,
    }
  })
const filteredRows = table.getFilteredRowModel().rows;
  const exportToCSV = () => {
    // Get headers that are currently visible
    const headers = table.getVisibleLeafColumns().map(column => {
      // Trying to get a string label for the header
      const headerDef = column.columnDef.header;
      if (typeof headerDef === 'string') return headerDef;
      return column.id;
    });

    // Get row data for visible columns
    const csvRows = table.getRowModel().rows.map(row => {
      return table.getVisibleLeafColumns().map(column => {
        const value = row.getValue(column.id);
        // Escape quotes and wrap in quotes if it contains commas or newlines
        const stringValue = String(value ?? "");
        if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `readings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {

  }, [lang])



  return (
    <section>
      <span className="flex gap-2 items-center">
         <Input
          placeholder= {lang === "pt-br" ? "Filtrar por descrição" : "Filter by description..."}
          value={(table.getColumn("descricao")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("descricao")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        
        <Button variant="outline" onClick={exportToCSV} className="ml-auto flex gap-2">
           <Download className="size-4" /> {lang === "pt-br" ? "Exportar CSV" : "Export CSV"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="">
              <Eye />{lang === "pt-br" ? "Colunas" : "Columns"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full" align="center">
            {table
              .getAllColumns()
              .filter(
                (column) => column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <h1>{filteredRows.length}/{data.length}</h1>
      </span>
      <ScrollArea className="h-110 w-300 mt-2 rounded-md border">

        <Table className="">
          <TableHeader title="Data" className="bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-background ">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}