import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    Column,
    getFacetedRowModel,
    getFacetedUniqueValues,
    InitialTableState,
    RowData,
} from "@tanstack/react-table";
import { Checkbox, TextInput, Select, Table } from "flowbite-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ColumnVisibilityMenu from "./ColumnVisibilityMenu";
import MultiSelectFilter from "./MultiSelectFilter";
import { useSearchParams } from "react-router";

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        getSum?: boolean;
        sumFormatter?: (sum: number) => ReactNode;
        truncateLength?: number
        filterType?: "dropdown" | "multiselect";
    }
}

interface TableCustomProps<T> {
    data: T[];
    columns: any[];
    setSelected?: (selected: T[]) => void;
    initialState?: InitialTableState;
}

function TableCustom<T> ({ data, columns, setSelected, initialState } : TableCustomProps<T>) {

    const getSortedUniqueValues = (column: Column<T, unknown>) => {
        return Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .slice(0, 5000)
    }

    columns = useMemo(() =>
        columns.map(column =>
            column.meta?.filterType === "dropdown"
                ? { ...column, filterFn: "equalsString" }
                : column
        ),
        [columns]
    )

    const table = useReactTable({
        data,
        columns,
        initialState,
        enableMultiRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
    const [highlightRowId, setHighlightRowId] = useState<string | null>(null)
    const [ searchParams ] = useSearchParams()
    const showRowId = searchParams.get('showRowId')

    const focusRow = (targetId: string) => {
        // Find the row index in the full data
        const tableRows = table.getPrePaginationRowModel().rows
        const rowIndex = tableRows.findIndex(row => (row.original as { _id: string })._id === targetId)
        const rowId = tableRows[rowIndex].id

        console.log(rowIndex, "hehe", targetId, table.getPrePaginationRowModel().rows[0].original)

        if (rowIndex === -1) return // not found

        // Calculate which page the row would be on
        const pageSize = table.getState().pagination.pageSize
        const pageIndex = Math.floor(rowIndex / pageSize)

        // Set page
        table.setPageIndex(pageIndex)

        // Delay scroll because page change is async
        setTimeout(async () => {
            const targetRow = rowRefs.current[rowId]
            if (targetRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
                setHighlightRowId(rowId)
                await new Promise(resolve => setTimeout(resolve, 2000)); //sleep for 2s
                setHighlightRowId(null)
            }
        }, 100)
    }

    useEffect(() => {
        if (showRowId && table.getPrePaginationRowModel().rows.length) focusRow(showRowId)
    },[showRowId, table.getPrePaginationRowModel().rows])

    useEffect(() => {
        if (setSelected) setSelected(Object.keys(table.getState().rowSelection).map(row => table.getRow(row).original))
    }, [table.getState().rowSelection])

    // Calculate column sums for columns with getSum: true
    const columnSums = useMemo(() => {
        const sums: Record<string, number> = {};
        table.getAllColumns().forEach(column => {
            if (column.columnDef.meta?.getSum) {
                sums[column.id] = table.getRowModel().rows.reduce((sum, row) => {
                    const value = column.columnDef.meta?.filterType ? row.original[column.id.toLowerCase() as keyof typeof row.original] : row.getValue(column.id);
                    return sum + (typeof value === "number" ? value : 0);
                }, 0);
            }
        });
        return sums;
    }, [table.getRowModel().rows]);

    return (
        <>
            <div className="flex flex-col min-w-full w-min space-y-2">
                <ColumnVisibilityMenu table={table} />
                <Table>
                    {table.getHeaderGroups().map(headerGroup => (
                        <Table.Head className="bg-gray-200" key={headerGroup.id}>
                            <Table.HeadCell className="bg-inherit px-4 py-2.5">
                                {table.getHeaderGroups().length > 1 && !headerGroup.depth ? null : <Checkbox
                                    {...{
                                        checked: table.getIsAllPageRowsSelected(),
                                        onChange: table.getToggleAllPageRowsSelectedHandler(),
                                    }}
                                />}
                            </Table.HeadCell>
                            {headerGroup.headers.map(header => (
                                <Table.HeadCell className={`bg-inherit whitespace-nowrap py-2.5 ${table.getHeaderGroups().length > 1 && !headerGroup.depth ? 'text-center' : ""}`} key={header.id} colSpan={header.colSpan}>
                                    {header.isPlaceholder ? null : (
                                        <>
                                            <div
                                                {...{
                                                    className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                                                    onClick: header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {header.column.columnDef.meta?.truncateLength && header.column.columnDef.meta?.truncateLength < header.column.columnDef.header!.length ? <div className="relative group">
                                                    <span>{flexRender(header.column.columnDef.header?.toString().slice(0, header.column.columnDef.meta.truncateLength) + '...', header.getContext())}</span>
                                                    <span className="absolute left-0 mt-5 opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-gray-300 text-gray-700 text-xs p-2 rounded shadow-lg">{header.column.columnDef.header?.toString()}</span>
                                                </div> : flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getIsSorted() === "asc" ? ' 🔼' : header.column.getIsSorted() === "desc" ? ' 🔽' : null}
                                            </div>
                                            {header.column.getCanFilter() ? (
                                                <div className="mt-2">
                                                    {header.column.columnDef.meta ? (header.column.columnDef.meta.filterType === "dropdown" ? (
                                                        <Select
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            value={(header.column.getFilterValue() ?? "") as string}
                                                            className="w-fit bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">All</option>
                                                            {getSortedUniqueValues(header.column).map(value => (
                                                                <option value={value} key={value}>{value}</option>
                                                            ))}
                                                        </Select>) : <MultiSelectFilter column={header.column} />
                                                    ) : (
                                                        <TextInput
                                                            className="w-fit bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            placeholder="Search..."
                                                            type="text"
                                                            value={(header.column.getFilterValue() ?? '') as string}
                                                        />
                                                    )}
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </Table.HeadCell>
                            ))}
                        </Table.Head>
                    ))}
                    <Table.Body>
                        {table.getRowModel().rows.map((row, index) => (
                            <Table.Row ref={el => (rowRefs.current[row.id] = el)} key={row.id} className={`${index % 2 ? "bg-gray-100" : "bg-white"} border ${highlightRowId === row.id
                                    ? 'animate-pulse bg-yellow-200/50'
                                    : ''
                                }`}>
                                <Table.Cell className="px-4 py-2.5">
                                    <Checkbox
                                        {...{
                                            checked: row.getIsSelected(),
                                            disabled: !row.getCanSelect(),
                                            onChange: row.getToggleSelectedHandler(),
                                        }}
                                    />
                                </Table.Cell>
                                {row.getVisibleCells().map(cell => (
                                    <Table.Cell className="text-gray-700 px-6  py-2.5" key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                        {Object.values(columnSums).some(sum => sum !== undefined) && (
                            <Table.Row className="bg-gray-200 text-black font-bold text-lg">
                                <Table.Cell className="px-4 py-2.5">Total</Table.Cell>
                                {table.getVisibleLeafColumns().map(column => (
                                    <Table.Cell key={column.id} className="px-0 py-2.5">
                                        {column.columnDef.meta?.getSum ? column.columnDef.meta?.sumFormatter?.(columnSums[column.id]) ?? columnSums[column.id].toLocaleString() : null}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </div>

            <div className="flex justify-center items-center space-x-2 my-4">
                <button
                    className="border rounded p-1"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<<'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    {'>>'}
                </button>
                <span className="flex items-center gap-1">
                    <div>Page</div>
                    <strong>
                        {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </strong>
                </span>
                <span className="flex items-center gap-1">
                    | Go to page:
                    <input
                        type="number"
                        min="1"
                        max={table.getPageCount()}
                        defaultValue={table.getState().pagination.pageIndex + 1}
                        onChange={e => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            table.setPageIndex(page);
                        }}
                        className="border p-1 rounded w-16"
                    />
                </span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value));
                    }}
                >
                    {[5, 10, 20, 30, 40, 50, 100].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}

export default TableCustom;