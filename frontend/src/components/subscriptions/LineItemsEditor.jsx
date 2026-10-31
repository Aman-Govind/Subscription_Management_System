import React, { useState, useEffect } from 'react';
import productService from '../../services/productService';
import Button from '../common/Button';
import Input from '../common/Input';
import { Plus, Trash2, Tag, Layers, Calculator } from 'lucide-react';

export const LineItemsEditor = ({
  items = [],
  onChange,
  readOnly = false,
  billingCycle = 'monthly',
}) => {
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      const data = await productService.getProducts();
      setAvailableProducts(data);
    };
    fetchCatalog();
  }, []);

  const recalculateItem = (item, basePrice, variantDelta, qty, taxRate) => {
    const effectiveUnitPrice = Number(basePrice) || 0;
    const delta = Number(variantDelta) || 0;
    const quantity = Math.max(1, Number(qty) || 1);
    const tax = Number(taxRate) || 18;

    const lineUnit = effectiveUnitPrice + delta;
    const subtotal = lineUnit * quantity;
    const taxAmount = (subtotal * tax) / 100;
    const total = subtotal + taxAmount;

    return {
      ...item,
      unitPrice: effectiveUnitPrice,
      variantDelta: delta,
      quantity,
      taxRate: tax,
      subtotal,
      taxAmount,
      total,
    };
  };

  const handleProductSelect = (index, productId) => {
    const selectedProd = availableProducts.find((p) => p.id === productId);
    if (!selectedProd) return;

    const initialVariant = selectedProd.variants[0] || { id: 'var_std', name: 'Standard', additionalPrice: 0 };
    const basePrice = selectedProd.salesPrice || 10000;
    const delta = initialVariant.additionalPrice || 0;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      productId: selectedProd.id,
      productName: selectedProd.name,
      variantId: initialVariant.id,
      variantName: initialVariant.name,
      ...recalculateItem(updatedItems[index], basePrice, delta, updatedItems[index].quantity || 1, 18),
    };

    onChange(updatedItems);
  };

  const handleVariantSelect = (index, variantId) => {
    const currentItem = items[index];
    const product = availableProducts.find((p) => p.id === currentItem.productId);
    if (!product) return;

    const variant = product.variants?.find((v) => v.id === variantId) || { id: variantId, name: 'Standard', additionalPrice: 0 };

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      variantId: variant.id,
      variantName: variant.name,
      ...recalculateItem(
        updatedItems[index],
        currentItem.unitPrice,
        variant.additionalPrice || 0,
        currentItem.quantity,
        currentItem.taxRate
      ),
    };

    onChange(updatedItems);
  };

  const handleQuantityChange = (index, qty) => {
    const updatedItems = [...items];
    const current = updatedItems[index];
    updatedItems[index] = recalculateItem(
      current,
      current.unitPrice,
      current.variantDelta,
      qty,
      current.taxRate
    );
    onChange(updatedItems);
  };

  const handleUnitPriceChange = (index, price) => {
    const updatedItems = [...items];
    const current = updatedItems[index];
    updatedItems[index] = recalculateItem(
      current,
      price,
      current.variantDelta,
      current.quantity,
      current.taxRate
    );
    onChange(updatedItems);
  };

  const handleAddItem = () => {
    const defaultProduct = availableProducts[0] || {
      id: 'prod_default',
      name: 'Custom Cloud Subscription',
      salesPrice: 20000,
      variants: [{ id: 'var_odoo', name: 'Odoo Enterprise Connector Sync', additionalPrice: 560 }],
    };

    const defaultVariant = defaultProduct.variants[0] || { id: 'var_std', name: 'Standard', additionalPrice: 0 };

    const newItem = {
      id: `li_${Date.now()}`,
      productId: defaultProduct.id,
      productName: defaultProduct.name,
      variantId: defaultVariant.id,
      variantName: defaultVariant.name,
      unitPrice: defaultProduct.salesPrice,
      variantDelta: defaultVariant.additionalPrice || 0,
      quantity: 1,
      taxRate: 18,
      subtotal: (defaultProduct.salesPrice + (defaultVariant.additionalPrice || 0)) * 1,
      taxAmount: ((defaultProduct.salesPrice + (defaultVariant.additionalPrice || 0)) * 18) / 100,
      total: (defaultProduct.salesPrice + (defaultVariant.additionalPrice || 0)) * 1.18,
    };

    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  // Aggregated totals
  const totalSubtotal = items.reduce((acc, i) => acc + (i.subtotal || 0), 0);
  const totalTax = items.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
  const totalGross = totalSubtotal + totalTax;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Subscription Line Items & Add-ons
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dynamic service breakdown with variant price delta additions and statutory GST.
          </p>
        </div>

        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={handleAddItem}
          >
            Add Service Line
          </Button>
        )}
      </div>

      {/* Line Items Table/List */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3 min-w-[200px]">Product / Service</th>
                <th className="py-2.5 px-3 min-w-[210px]">Variant Add-on (Delta)</th>
                <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                <th className="py-2.5 px-3 w-32">Base (₹)</th>
                <th className="py-2.5 px-3 w-28">GST (18%)</th>
                <th className="py-2.5 px-3 w-32 text-right">Line Total (₹)</th>
                {!readOnly && <th className="py-2.5 px-2 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={readOnly ? 6 : 7}
                    className="py-6 text-center text-slate-500 font-mono text-xs"
                  >
                    No line items attached. Click "Add Service Line" to configure.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const product = availableProducts.find((p) => p.id === item.productId);
                  const variants = product?.variants || [
                    { id: item.variantId, name: item.variantName, additionalPrice: item.variantDelta },
                  ];

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-900/40">
                      {/* Product Selection */}
                      <td className="py-2.5 px-3">
                        {readOnly ? (
                          <div className="font-semibold text-slate-100">{item.productName}</div>
                        ) : (
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {availableProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Variant Selection with Delta */}
                      <td className="py-2.5 px-3">
                        {readOnly ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300">{item.variantName}</span>
                            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1 rounded border border-indigo-500/20">
                              {item.variantDelta === 0 ? '+₹0' : `+₹${item.variantDelta}`}
                            </span>
                          </div>
                        ) : (
                          <select
                            value={item.variantId}
                            onChange={(e) => handleVariantSelect(index, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.additionalPrice === 0 ? '+₹0' : `+₹${v.additionalPrice}`})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 text-center">
                        {readOnly ? (
                          <span className="font-mono text-slate-200">{item.quantity}</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className="w-16 px-2 py-1 text-xs text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-2.5 px-3">
                        {readOnly ? (
                          <span className="font-mono text-slate-300">
                            ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <div className="relative">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                      </td>

                      {/* Tax */}
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        ₹{Math.round(item.taxAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                        ₹{Math.round(item.total || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Remove Button */}
                      {!readOnly && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Aggregated Calculation Summary Footer */}
        <div className="bg-slate-900/90 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span>Cycle: <span className="uppercase text-slate-200 font-semibold">{billingCycle}</span></span>
            <span>•</span>
            <span>Tax Jurisdiction: <span className="text-slate-200">GST 18%</span></span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 mr-2">Taxable Subtotal:</span>
              <span className="font-mono text-slate-200 font-semibold">
                ₹{Math.round(totalSubtotal).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 mr-2">Total GST:</span>
              <span className="font-mono text-slate-300 font-semibold">
                ₹{Math.round(totalTax).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="pl-3 border-l border-slate-700">
              <span className="text-slate-400 mr-2">Gross Total:</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                ₹{Math.round(totalGross).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineItemsEditor;

