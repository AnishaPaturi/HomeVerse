"use client";

import React from "react";
import { formatIndianBudget } from "@/lib/utils";
import { ExternalLink, Tag, Check, ShoppingCart } from "lucide-react";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  vendor: string;
  price: number;
  imageUrl?: string;
  dimensions?: string;
  material?: string;
  productUrl?: string;
  inStock?: boolean;
}

interface ProductCardProps {
  product: ProductItem;
  onSelect?: (product: ProductItem) => void;
  isSelected?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isSelected = false,
}) => {
  return (
    <div
      className={`rounded-2xl border bg-[#090e15] overflow-hidden transition-all flex flex-col justify-between group ${
        isSelected
          ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
          : "border-white/[0.08] hover:border-slate-700"
      }`}
    >
      {/* Product Image */}
      <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 font-mono text-xs">
            NO PREVIEW
          </div>
        )}

        {/* Vendor Badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1">
          <Tag className="w-3 h-3 text-emerald-400" />
          <span>{product.vendor}</span>
        </div>

        {/* Category Pill */}
        <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/30 text-[10px] font-mono text-emerald-300 capitalize">
          {product.category}
        </div>
      </div>

      {/* Info Container */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
            {product.name}
          </h4>
          {product.dimensions && (
            <p className="text-[11px] text-slate-400 font-mono">
              Dims: {product.dimensions}
            </p>
          )}
          {product.material && (
            <p className="text-[11px] text-slate-400 font-light line-clamp-1">
              {product.material}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-mono">ESTIMATED PRICE</div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {formatIndianBudget(product.price)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product.productUrl && (
              <a
                href={product.productUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="View product store"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {onSelect && (
              <button
                type="button"
                onClick={() => onSelect(product)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-900 hover:bg-emerald-950/60 text-slate-200 border border-slate-700 hover:border-emerald-500/40"
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Choose</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
