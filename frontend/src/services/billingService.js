import api from './api';

const INITIAL_INVOICES = [
  {
    id: 'inv_001',
    invoiceNumber: 'INV-2026-0891',
    subscriptionNumber: 'SUB-2026-0041',
    customer: 'Acme Global Logistics',
    customerEmail: 'customer@acme.corp',
    billingAddress: '42 Freight Highway, Sector 5, Bengaluru, KA',
    status: 'paid', // 'draft' | 'confirmed' | 'paid'
    invoiceDate: '2026-10-01',
    dueDate: '2026-10-31',
    paidDate: '2026-10-28',
    paymentMethod: 'Bank Wire Transfer',
    paymentReference: 'WIRE-AXIS-992014',
    currency: '₹',
    lineItems: [
      {
        id: 'ili_01',
        description: 'Enterprise Cloud Core (Monthly Commitment)',
        quantity: 1,
        unitPrice: 32000,
        subtotal: 32000,
      },
      {
        id: 'ili_02',
        description: 'Odoo Enterprise Connector Sync Add-on (+₹560)',
        quantity: 1,
        unitPrice: 560,
        subtotal: 560,
      },
    ],
    subtotal: 32560,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: 32560,
    taxRate: 18,
    taxAmount: 5860.8,
    totalAmount: 38420.8,
    notes: 'Payment received via Axis Corporate Gateway. Standard Net 30 settled.',
  },
  {
    id: 'inv_002',
    invoiceNumber: 'INV-2026-0892',
    subscriptionNumber: 'SUB-2026-0042',
    customer: 'Vanguard Retail Systems',
    customerEmail: 'ops@vanguardretail.in',
    billingAddress: 'Unit 12 Tech Park, Bandra Kurla Complex, Mumbai, MH',
    status: 'confirmed',
    invoiceDate: '2026-10-15',
    dueDate: '2026-11-02',
    paidDate: null,
    paymentMethod: null,
    paymentReference: null,
    currency: '₹',
    lineItems: [
      {
        id: 'ili_03',
        description: 'Revenue Intelligence Platform (Monthly Cadence)',
        quantity: 1,
        unitPrice: 14000,
        subtotal: 14000,
      },
      {
        id: 'ili_04',
        description: 'Odoo Invoicing Webhook Integration (+₹560)',
        quantity: 1,
        unitPrice: 560,
        subtotal: 560,
      },
    ],
    subtotal: 14560,
    discountType: 'percentage',
    discountValue: 5, // 5% promotional discount
    discountAmount: 728,
    taxableAmount: 13832,
    taxRate: 18,
    taxAmount: 2489.76,
    totalAmount: 16321.76,
    notes: 'Invoice issued upon contract confirmation. 5% promotional cohort discount applied.',
  },
  {
    id: 'inv_003',
    invoiceNumber: 'INV-2026-0893',
    subscriptionNumber: 'SUB-2026-0043',
    customer: 'Nexis Media Works',
    customerEmail: 'billing@nexismedia.io',
    billingAddress: 'Cyber City Hub, Sector 25, Gurugram, HR',
    status: 'paid',
    invoiceDate: '2026-10-23',
    dueDate: '2026-10-30',
    paidDate: '2026-10-29',
    paymentMethod: 'UPI Auto-Debit',
    paymentReference: 'UPI-ICICI-881203',
    currency: '₹',
    lineItems: [
      {
        id: 'ili_05',
        description: 'Revenue Intelligence Platform (Weekly Burst)',
        quantity: 2,
        unitPrice: 3500,
        subtotal: 7000,
      },
    ],
    subtotal: 7000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: 7000,
    taxRate: 18,
    taxAmount: 1260,
    totalAmount: 8260,
    notes: 'Settled via automated UPI recurring mandate.',
  },
  {
    id: 'inv_004',
    invoiceNumber: 'INV-2026-0894',
    subscriptionNumber: 'SUB-2026-0044',
    customer: 'Hyperion BioTech',
    customerEmail: 'finance@hyperionbio.com',
    billingAddress: 'Biotech Innovation Campus, Whitefield, Bengaluru, KA',
    status: 'confirmed',
    invoiceDate: '2026-10-10',
    dueDate: '2026-10-24', // Past due date -> Overdue
    paidDate: null,
    paymentMethod: null,
    paymentReference: null,
    currency: '₹',
    lineItems: [
      {
        id: 'ili_06',
        description: 'Custom API Cluster & SLA (Yearly Allocation)',
        quantity: 1,
        unitPrice: 88000,
        subtotal: 88000,
      },
    ],
    subtotal: 88000,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: 88000,
    taxRate: 18,
    taxAmount: 15840,
    totalAmount: 103840,
    notes: 'Past due Net 14 terms. Second collection reminder delivered.',
  },
  {
    id: 'inv_005',
    invoiceNumber: 'INV-2026-0895',
    subscriptionNumber: 'SUB-2026-0041',
    customer: 'Solaris FinTech Corp',
    customerEmail: 'accounts@solarisfin.com',
    billingAddress: 'Tower 4, Financial District, Hyderabad, TG',
    status: 'draft',
    invoiceDate: '2026-10-31',
    dueDate: '2026-11-30',
    paidDate: null,
    paymentMethod: null,
    paymentReference: null,
    currency: '₹',
    lineItems: [
      {
        id: 'ili_07',
        description: 'API Gateway & Event Dispatcher (Monthly)',
        quantity: 1,
        unitPrice: 8000,
        subtotal: 8000,
      },
    ],
    subtotal: 8000,
    discountType: 'fixed',
    discountValue: 500, // ₹500 early-adopter credit
    discountAmount: 500,
    taxableAmount: 7500,
    taxRate: 18,
    taxAmount: 1350,
    totalAmount: 8850,
    notes: 'Draft bill generated for November service cycle. Awaiting confirmation.',
  },
];

const INITIAL_PAYMENTS = [
  {
    id: 'pay_001',
    paymentNumber: 'PAY-2026-0412',
    invoiceNumber: 'INV-2026-0891',
    customer: 'Acme Global Logistics',
    amount: 38420.8,
    paymentMethod: 'Bank Wire Transfer',
    paymentDate: '2026-10-28',
    referenceNumber: 'WIRE-AXIS-992014',
    status: 'settled',
    notes: 'Quarterly cluster renewal settled in full.',
  },
  {
    id: 'pay_002',
    paymentNumber: 'PAY-2026-0413',
    invoiceNumber: 'INV-2026-0893',
    customer: 'Nexis Media Works',
    amount: 8260,
    paymentMethod: 'UPI Auto-Debit',
    paymentDate: '2026-10-29',
    referenceNumber: 'UPI-ICICI-881203',
    status: 'settled',
    notes: 'Automated weekly debit clearance.',
  },
];

export const billingService = {
  /**
   * Fetch all invoices with local storage cache fallback
   */
  async getInvoices() {
    try {
      const response = await api.get('/invoices');
      return response.data;
    } catch {
      const stored = localStorage.getItem('brightloop_invoices');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem('brightloop_invoices', JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
  },

  /**
   * Fetch single invoice by ID or Invoice Number
   */
  async getInvoiceById(idOrNumber) {
    const list = await this.getInvoices();
    return (
      list.find((inv) => inv.id === idOrNumber || inv.invoiceNumber === idOrNumber) || null
    );
  },

  /**
   * Admin trigger to automatically generate due invoices from active subscriptions
   */
  async generateDueInvoices() {
    try {
      const response = await api.post('/invoices/generate-due');
      return response.data;
    } catch {
      // Offline simulation: generates due billing records for pending cycles
      const list = await this.getInvoices();
      const newInvoiceNumber = `INV-2026-089${list.length + 1}`;

      const generatedInvoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: newInvoiceNumber,
        subscriptionNumber: 'SUB-2026-0041',
        customer: 'Acme Global Logistics',
        customerEmail: 'customer@acme.corp',
        billingAddress: '42 Freight Highway, Sector 5, Bengaluru, KA',
        status: 'draft',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidDate: null,
        paymentMethod: null,
        paymentReference: null,
        currency: '₹',
        lineItems: [
          {
            id: `ili_${Date.now()}_1`,
            description: 'Enterprise Cloud Core (Auto-Generated Renewal Cycle)',
            quantity: 1,
            unitPrice: 32000,
            subtotal: 32000,
          },
          {
            id: `ili_${Date.now()}_2`,
            description: 'Odoo Enterprise Connector Sync (+₹560)',
            quantity: 1,
            unitPrice: 560,
            subtotal: 560,
          },
        ],
        subtotal: 32560,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        taxableAmount: 32560,
        taxRate: 18,
        taxAmount: 5860.8,
        totalAmount: 38420.8,
        notes: 'Automated invoice generated by scheduled renewal trigger.',
      };

      const updated = [generatedInvoice, ...list];
      localStorage.setItem('brightloop_invoices', JSON.stringify(updated));
      return { success: true, count: 1, generated: [generatedInvoice] };
    }
  },

  /**
   * Confirm a draft invoice
   */
  async confirmInvoice(invoiceId) {
    const list = await this.getInvoices();
    const updated = list.map((inv) => {
      if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
        return {
          ...inv,
          status: 'confirmed',
          confirmedDate: new Date().toISOString().split('T')[0],
        };
      }
      return inv;
    });

    localStorage.setItem('brightloop_invoices', JSON.stringify(updated));
    return updated.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
  },

  /**
   * Record a payment against an invoice and update states
   */
  async recordPayment({ invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes }) {
    try {
      const response = await api.post(`/invoices/${invoiceId}/payments`, {
        amount,
        paymentMethod,
        paymentDate,
        referenceNumber,
        notes,
      });
      return response.data;
    } catch {
      const invoices = await this.getInvoices();
      const payments = await this.getPayments();

      let targetInvoice = invoices.find(
        (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
      );

      if (!targetInvoice) {
        throw new Error('Target invoice not found');
      }

      const paymentNumber = `PAY-2026-04${payments.length + 14}`;
      const effectiveDate = paymentDate || new Date().toISOString().split('T')[0];

      const newPayment = {
        id: `pay_${Date.now()}`,
        paymentNumber,
        invoiceNumber: targetInvoice.invoiceNumber,
        customer: targetInvoice.customer,
        amount: Number(amount) || targetInvoice.totalAmount,
        paymentMethod: paymentMethod || 'Bank Wire Transfer',
        paymentDate: effectiveDate,
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        status: 'settled',
        notes: notes || 'Manual payment recorded via console.',
      };

      // Update Invoice State to Paid
      const updatedInvoices = invoices.map((inv) => {
        if (inv.id === targetInvoice.id) {
          return {
            ...inv,
            status: 'paid',
            paidDate: effectiveDate,
            paymentMethod: newPayment.paymentMethod,
            paymentReference: newPayment.referenceNumber,
          };
        }
        return inv;
      });

      const updatedPayments = [newPayment, ...payments];

      localStorage.setItem('brightloop_invoices', JSON.stringify(updatedInvoices));
      localStorage.setItem('brightloop_payments', JSON.stringify(updatedPayments));

      return { success: true, payment: newPayment, invoice: targetInvoice };
    }
  },

  /**
   * Fetch all settled and logged payments
   */
  async getPayments() {
    try {
      const response = await api.get('/payments');
      return response.data;
    } catch {
      const stored = localStorage.getItem('brightloop_payments');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem('brightloop_payments', JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
  },
};

export default billingService;
