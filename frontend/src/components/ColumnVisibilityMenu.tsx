import { Table } from '@tanstack/react-table';
import { useState } from 'react';

function ColumnVisibilityMenu<TData,>({ table }: { table: Table<TData> }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Button to toggle submenu */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-600"
      >
        Show/Hide Columns
      </button>

      {/* Submenu */}
      {isMenuOpen && (
        <div
          className="absolute z-[5] top-full left-0 mt-2 w-auto bg-white border border-gray-300 rounded-lg shadow-lg"
        >
          <div className="px-4 py-2 border-b border-gray-300 bg-gray-100">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                checked={table.getIsAllColumnsVisible()}
                onChange={table.getToggleAllColumnsVisibilityHandler()}
              />
              Toggle All
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4">
            {table.getAllLeafColumns().map((column) => (
              <div key={column.id} className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                <span className="text-sm">{column.columnDef.header?.toString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColumnVisibilityMenu;