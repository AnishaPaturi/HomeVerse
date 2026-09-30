import React from "react";
import { ShoppingItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ShoppingTableProps {
  items: ShoppingItem[];
}

export const ShoppingTable: React.FC<ShoppingTableProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 rounded-xl">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-800">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Item</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Quantity</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Estimated Cost</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
              <td className="px-4 py-3 text-gray-500">{item.quantity}</td>
              <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(item.estimated_cost)}</td>
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs capitalize bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
