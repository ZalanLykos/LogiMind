import { useState } from 'react';
import type { DailyRecord } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  records: DailyRecord[];
  onUpdateRecord: (index: number, updatedRecord: DailyRecord) => void;
}

const ROWS_PER_PAGE = 50;

export function DataTable({ records, onUpdateRecord }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{ index: number; field: keyof DailyRecord } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = records.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handleCellClick = (index: number, field: keyof DailyRecord, value: unknown) => {
    // Only allow editing of numeric fields
    const editableFields: (keyof DailyRecord)[] = [
      'demand_units',
      'production_units',
      'cost_per_unit',
      'sales_price_per_unit'
    ];
    
    if (!editableFields.includes(field)) return;
    
    setEditingCell({ index: startIndex + index, field });
    setEditValue(String(value));
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const record = records[editingCell.index];
    let updatedRecord: DailyRecord;

    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      setEditingCell(null);
      return;
    }

    switch (editingCell.field) {
      case 'demand_units':
        updatedRecord = { ...record, demand_units: Math.max(0, numValue) };
        break;
      case 'production_units':
        updatedRecord = { ...record, production_units: Math.max(0, numValue) };
        break;
      case 'cost_per_unit':
        updatedRecord = { 
          ...record, 
          cost_per_unit: numValue,
          total_cost: Math.round(record.production_units * numValue * 100) / 100
        };
        break;
      case 'sales_price_per_unit':
        updatedRecord = { 
          ...record, 
          sales_price_per_unit: numValue,
          total_revenue: Math.round(record.production_units * numValue * 100) / 100
        };
        break;
      default:
        updatedRecord = record;
    }

    onUpdateRecord(editingCell.index, updatedRecord);
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Production</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Unit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRecords.map((record, idx) => (
              <tr key={`${record.date}-${record.product_id}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">{record.product_id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{record.product_name}</td>
                
                {/* Editable: Demand */}
                <td 
                  className="px-4 py-2 whitespace-nowrap text-sm text-right cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCellClick(idx, 'demand_units', record.demand_units)}
                >
                  {editingCell?.index === startIndex + idx && editingCell?.field === 'demand_units' ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellSave}
                      onKeyDown={handleKeyDown}
                      className="w-20 px-2 py-1 text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-900">{formatNumber(record.demand_units)}</span>
                  )}
                </td>

                {/* Editable: Production */}
                <td 
                  className="px-4 py-2 whitespace-nowrap text-sm text-right cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCellClick(idx, 'production_units', record.production_units)}
                >
                  {editingCell?.index === startIndex + idx && editingCell?.field === 'production_units' ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellSave}
                      onKeyDown={handleKeyDown}
                      className="w-20 px-2 py-1 text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-900">{formatNumber(record.production_units)}</span>
                  )}
                </td>

                {/* Editable: Cost per Unit */}
                <td 
                  className="px-4 py-2 whitespace-nowrap text-sm text-right cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCellClick(idx, 'cost_per_unit', record.cost_per_unit)}
                >
                  {editingCell?.index === startIndex + idx && editingCell?.field === 'cost_per_unit' ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellSave}
                      onKeyDown={handleKeyDown}
                      className="w-24 px-2 py-1 text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-900">{formatCurrency(record.cost_per_unit)}</span>
                  )}
                </td>

                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(record.total_cost)}</td>

                {/* Editable: Sales Price */}
                <td 
                  className="px-4 py-2 whitespace-nowrap text-sm text-right cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCellClick(idx, 'sales_price_per_unit', record.sales_price_per_unit)}
                >
                  {editingCell?.index === startIndex + idx && editingCell?.field === 'sales_price_per_unit' ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellSave}
                      onKeyDown={handleKeyDown}
                      className="w-24 px-2 py-1 text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-900">{formatCurrency(record.sales_price_per_unit)}</span>
                  )}
                </td>

                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(record.total_revenue)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                  <span className={`${record.inventory_end_of_day === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                    {formatNumber(record.inventory_end_of_day)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{record.supplier_id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                    ${record.transport_mode === 'Air' ? 'bg-blue-100 text-blue-800' : 
                      record.transport_mode === 'Ship' ? 'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {record.transport_mode}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{record.region}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={record.notes}>
                  {record.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
          <span className="font-medium">{Math.min(startIndex + ROWS_PER_PAGE, records.length)}</span> of{' '}
          <span className="font-medium">{records.length}</span> records
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
