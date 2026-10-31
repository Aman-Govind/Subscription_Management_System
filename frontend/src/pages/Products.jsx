import React, { useState, useEffect, useMemo } from 'react';
import productService from '../services/productService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import {
  Package,
  Plus,
  Search,
  Layers,
  Calendar,
  Tag,
  DollarSign,
  TrendingUp,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const Products = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'plans'
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'SaaS Subscription',
    salesPrice: 24000,
    costPrice: 11000,
    notes: '',
    initialVariantName: 'Odoo Enterprise Connector',
    initialVariantCode: 'ODOO-560',
    initialVariantDelta: 560,
  });

  // New Plan Form State
  const [newPlan, setNewPlan] = useState({
    productId: '',
    name: '',
    price: 24000,
    billingFrequency: 'monthly',
    availability: 'active',
  });

  // New Variant Form State
  const [newVariant, setNewVariant] = useState({
    name: 'Odoo Connector Add-on',
    code: 'ODOO-560',
    additionalPrice: 560,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [productsData, plansData] = await Promise.all([
      productService.getProducts(),
      productService.getPlans(),
    ]);
    setProducts(productsData);
    setPlans(plansData);
    if (productsData.length > 0 && !newPlan.productId) {
      setNewPlan((prev) => ({
        ...prev,
        productId: productsData[0].id,
        name: `${productsData[0].name} — Monthly`,
      }));
    }
    setIsLoading(false);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const payload = {
      name: newProduct.name.trim(),
      type: newProduct.type,
      salesPrice: Number(newProduct.salesPrice) || 0,
      costPrice: Number(newProduct.costPrice) || 0,
      notes: newProduct.notes.trim(),
      variants: [
        { id: `var_std_${Date.now()}`, name: 'Standard Edition', code: 'STD', additionalPrice: 0 },
        {
          id: `var_odoo_${Date.now()}`,
          name: newProduct.initialVariantName || 'Odoo Connector Integration',
          code: newProduct.initialVariantCode || 'ODOO-560',
          additionalPrice: Number(newProduct.initialVariantDelta) || 560,
        },
      ],
    };

    await productService.createProduct(payload);
    setIsProductModalOpen(false);
    setNewProduct({
      name: '',
      type: 'SaaS Subscription',
      salesPrice: 24000,
      costPrice: 11000,
      notes: '',
      initialVariantName: 'Odoo Enterprise Connector',
      initialVariantCode: 'ODOO-560',
      initialVariantDelta: 560,
    });
    await loadData();
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlan.name.trim() || !newPlan.productId) return;

    const selectedProd = products.find((p) => p.id === newPlan.productId);

    await productService.createPlan({
      ...newPlan,
      productName: selectedProd?.name || 'Custom Service',
      price: Number(newPlan.price) || 0,
    });

    setIsPlanModalOpen(false);
    setNewPlan({
      productId: products[0]?.id || '',
      name: '',
      price: 24000,
      billingFrequency: 'monthly',
      availability: 'active',
    });
    await loadData();
  };

  const handleAddVariantSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductForVariant || !newVariant.name.trim()) return;

    await productService.addVariant(selectedProductForVariant.id, newVariant);
    setIsVariantModalOpen(false);
    setSelectedProductForVariant(null);
    setNewVariant({
      name: 'Odoo Connector Add-on',
      code: 'ODOO-560',
      additionalPrice: 560,
    });
    await loadData();
  };

  const openVariantModal = (product) => {
    setSelectedProductForVariant(product);
    setIsVariantModalOpen(true);
  };

  // Filtered Lists
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const filteredPlans = useMemo(() => {
    return plans.filter(
      (pl) =>
        pl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.billingFrequency.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  // Product Table Columns
  const productColumns = [
    {
      key: 'name',
      header: 'Product Name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-100">{row.name}</div>
          <div className="text-[11px] text-slate-400 max-w-sm truncate mt-0.5">{row.notes}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {row.type}
        </span>
      ),
    },
    {
      key: 'salesPrice',
      header: 'Sales Price',
      render: (row) => (
        <span className="font-mono text-slate-100 font-bold">
          ₹{Number(row.salesPrice).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      render: (row) => (
        <span className="font-mono text-slate-400">
          ₹{Number(row.costPrice).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (row) => {
        const sales = Number(row.salesPrice) || 0;
        const cost = Number(row.costPrice) || 0;
        const marginPct = sales > 0 ? Math.round(((sales - cost) / sales) * 100) : 0;
        return (
          <span className="font-mono text-emerald-400 font-medium">
            {marginPct}%
          </span>
        );
      },
    },
    {
      key: 'variants',
      header: 'Configured Variants & Add-ons',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
          {row.variants?.map((v) => (
            <span
              key={v.id}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                v.additionalPrice > 0
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span>{v.name}</span>
              <span className="font-bold">
                {v.additionalPrice === 0 ? '+₹0' : `+₹${v.additionalPrice}`}
              </span>
            </span>
          ))}
          <button
            type="button"
            onClick={() => openVariantModal(row)}
            className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 underline px-1 py-0.5 ml-1"
          >
            + Add Variant
          </button>
        </div>
      ),
    },
  ];

  // Plan Table Columns
  const planColumns = [
    {
      key: 'name',
      header: 'Plan Title',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-100">{row.name}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Target: {row.productName}
          </div>
        </div>
      ),
    },
    {
      key: 'billingFrequency',
      header: 'Billing Frequency',
      render: (row) => (
        <span className="capitalize font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
          {row.billingFrequency}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Plan Price',
      render: (row) => (
        <span className="font-mono text-slate-100 font-bold">
          ₹{Number(row.price).toLocaleString('en-IN')}
          <span className="text-[10px] font-normal text-slate-400 ml-1">
            /{row.billingFrequency}
          </span>
        </span>
      ),
    },
    {
      key: 'mrrEquivalent',
      header: 'Monthly Run-Rate (MRR)',
      render: (row) => {
        const equiv = productService.calculateMonthlyEquivalent(
          row.price,
          row.billingFrequency
        );
        return (
          <span className="font-mono text-emerald-400 font-medium">
            ₹{Math.round(equiv).toLocaleString('en-IN')}/mo
          </span>
        );
      },
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (row) => {
        const styles = {
          active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          beta: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border font-medium ${
              styles[row.availability] || styles.active
            }`}
          >
            {row.availability}
          </span>
        );
      },
    },
    {
      key: 'subscribersCount',
      header: 'Subscribers',
      render: (row) => (
        <span className="font-mono text-slate-300 font-semibold">
          {row.subscribersCount} active
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Products & Subscription Plans
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Master billing catalog with recurring frequency models and variant price delta additions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'products' ? (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsProductModalOpen(true)}
            >
              Add Product
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsPlanModalOpen(true)}
            >
              Add Billing Plan
            </Button>
          )}
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-none flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Master Products ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 sm:flex-none flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'plans'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Billing Plans ({plans.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            icon={Search}
            placeholder={
              activeTab === 'products'
                ? 'Search products or notes...'
                : 'Search plans or frequencies...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tab 1: Products Catalog */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <Table
            columns={productColumns}
            data={filteredProducts}
            isLoading={isLoading}
            keyField="id"
            emptyMessage="No products found in catalog."
          />
        </div>
      )}

      {/* Tab 2: Billing Plans View */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <Table
            columns={planColumns}
            data={filteredPlans}
            isLoading={isLoading}
            keyField="id"
            emptyMessage="No billing plans registered."
          />
        </div>
      )}

      {/* Modal: Create Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Master Product"
        subtitle="Register a product with base sales/cost pricing and optional variant add-ons."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Product Name"
              required
              placeholder="e.g. Enterprise Cloud Suite"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Product Type
              </label>
              <select
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
              >
                <option value="SaaS Subscription">SaaS Subscription</option>
                <option value="Service & Analytics">Service & Analytics</option>
                <option value="API Provisioning">API Provisioning</option>
                <option value="Digital License">Digital License</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sales Price (₹)"
              type="number"
              mono
              required
              value={newProduct.salesPrice}
              onChange={(e) => setNewProduct({ ...newProduct, salesPrice: e.target.value })}
            />
            <Input
              label="Cost Price (₹)"
              type="number"
              mono
              required
              value={newProduct.costPrice}
              onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Technical & Service Notes
            </label>
            <textarea
              rows={2}
              placeholder="Describe service parameters, SLAs, and infrastructure details..."
              value={newProduct.notes}
              onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
              className="block w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* Configurable Initial Variant */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
              Initial Product Variant Configuration
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Variant Name"
                  placeholder="e.g. Odoo Enterprise Connector"
                  value={newProduct.initialVariantName}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, initialVariantName: e.target.value })
                  }
                />
              </div>
              <Input
                label="Price Delta (₹)"
                type="number"
                mono
                placeholder="560"
                value={newProduct.initialVariantDelta}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, initialVariantDelta: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Billing Plan */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Add Billing Plan"
        subtitle="Define recurring frequency (daily, weekly, monthly, yearly) and pricing."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Linked Product
            </label>
            <select
              value={newPlan.productId}
              onChange={(e) => {
                const prod = products.find((p) => p.id === e.target.value);
                setNewPlan({
                  ...newPlan,
                  productId: e.target.value,
                  name: prod ? `${prod.name} — ${newPlan.billingFrequency}` : newPlan.name,
                });
              }}
              className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Sales: ₹{p.salesPrice})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Plan Display Title"
            required
            placeholder="e.g. Enterprise Core — Monthly Sprint"
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Billing Frequency
              </label>
              <select
                value={newPlan.billingFrequency}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, billingFrequency: e.target.value })
                }
                className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono capitalize"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <Input
              label="Plan Recurring Price (₹)"
              type="number"
              mono
              required
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Plan Availability Status
            </label>
            <select
              value={newPlan.availability}
              onChange={(e) => setNewPlan({ ...newPlan, availability: e.target.value })}
              className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
            >
              <option value="active">Active (Available for subscription)</option>
              <option value="beta">Beta (Limited access)</option>
              <option value="suspended">Suspended (Grandfathered only)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Billing Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Variant to Product */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title={`Add Variant — ${selectedProductForVariant?.name || ''}`}
        subtitle="Attach a variant or connector add-on with configurable price delta."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddVariantSubmit} className="space-y-4">
          <Input
            label="Variant Add-on Title"
            required
            placeholder="e.g. Odoo ERP Connector Integration"
            value={newVariant.name}
            onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Variant Code"
              required
              mono
              placeholder="e.g. ODOO-560"
              value={newVariant.code}
              onChange={(e) => setNewVariant({ ...newVariant, code: e.target.value })}
            />
            <Input
              label="Price Delta (₹)"
              type="number"
              mono
              required
              placeholder="560"
              value={newVariant.additionalPrice}
              onChange={(e) =>
                setNewVariant({ ...newVariant, additionalPrice: e.target.value })
              }
            />
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            The price delta will be added onto the base plan price when this variant is active on a subscription line item.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsVariantModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Variant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;

