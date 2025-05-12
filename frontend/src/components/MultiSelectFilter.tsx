import { Column } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler'

function MultiSelectFilter({ column }: { column: Column<any, unknown> }) {

  const [values, setValues] = useState<string[]>([])
  const [filterValues, setfilterValues] = useState<string[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {

    column.columnDef.filterFn = (row, _columnId, filterValue) => {
      if (!filterValue || filterValue.length === 0) return true
      return filterValue.includes(row.getValue(column.id))
    }

    setValues(Array.from(column.getFacetedUniqueValues().keys())
      .sort()
      .slice(0, 5000))
  }, [column])

  return (
    <OutsideClickHandler
      onOutsideClick={() => setIsMenuOpen(false)}
    >
      <div className='relative w-32'>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-20 h-10 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
        >
          Select
        </button>

        {isMenuOpen && (
          <div
            className="absolute z-10 top-full left-0 mt-2 w-auto bg-white border border-gray-300 rounded-lg shadow-lg"
          >
            <div className="px-4 py-2 border-b border-gray-300 bg-gray-100">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  checked={filterValues === values}
                  onChange={() => {
                    if (filterValues === values) setfilterValues([])
                    else setfilterValues(values)
                    column.setFilterValue([])
                  }}
                />
                Select All
              </label>
            </div>
            <div className="flex flex-wrap w-56 space-y-4 p-4">
              {values.map((value, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    checked={filterValues.includes(value)}
                    onChange={() => {
                      if (filterValues.includes(value)) filterValues.splice(filterValues.indexOf(value))
                      else filterValues.push(value)
                      column.setFilterValue(filterValues)
                    }}
                  />
                  <span className="text-sm w-fit">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OutsideClickHandler>
  );
}

export default MultiSelectFilter;