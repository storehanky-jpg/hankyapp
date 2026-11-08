import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, X, Printer, Store, Package, Scale,
  Check, Clock, ArrowLeft, Search, FileText, FileCheck,
  Users, Phone, Mail, TrendingUp, ShoppingBag, Tag,
  ChevronRight, ChevronDown, Sparkles, Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { BulkSale, Sale, ShopSale, Customer, FiscalInfo } from '../types';

type SaleType = 'vrac' | 'boite20' | 'boite10' | 'boite6' | 'magasin';

const SALE_TYPES: { id: SaleType; label: string; shortLabel: string; icon: React.ReactNode; table: 'bulk' | 'sales' | 'shop'; color: string }[] = [
  { id: 'vrac', label: 'Macaron en Vrac (kg)', shortLabel: 'Vrac', icon: <Scale size={16} />, table: 'bulk', color: 'amber' },
  { id: 'boite20', label: 'Boîte 20 pcs', shortLabel: 'Boîte 20', icon: <Package size={16} />, table: 'sales', color: 'emerald' },
  { id: 'boite10', label: 'Boîte 10 pcs', shortLabel: 'Boîte 10', icon: <Package size={16} />, table: 'sales', color: 'teal' },
  { id: 'boite6', label: 'Boîte 06 pcs', shortLabel: 'Boîte 6', icon: <Package size={16} />, table: 'sales', color: 'cyan' },
  { id: 'magasin', label: 'Coques Magasin', shortLabel: 'Magasin', icon: <Store size={16} />, table: 'shop', color: 'blue' },
];

const DEFAULT_PRICES: Record<SaleType, number> = {
  vrac: 1800, boite20: 1100, boite10: 600, boite6: 400, magasin: 40,
};

const colorMap: Record<string, { bg: string; text: string; border: string; light: string; solid: string }> = {
  amber: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50', solid: 'bg-amber-100 text-amber-700' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50', solid: 'bg-emerald-100 text-emerald-700' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', light: 'bg-teal-50', solid: 'bg-teal-100 text-teal-700' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-700', border: 'border-cyan-200', light: 'bg-cyan-50', solid: 'bg-cyan-100 text-cyan-700' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50', solid: 'bg-blue-100 text-blue-700' },
};

function getCustomerPrice(customer: Customer | null, type: SaleType): number {
  if (!customer?.prices) return DEFAULT_PRICES[type];
  const found = customer.prices.find(p => p.product_type === type);
  if (found) return found.unit_price;
  if (type === 'boite20') { const f = customer.prices.find(p => p.box_size === 20); if (f) return f.unit_price; }
  if (type === 'boite10') { const f = customer.prices.find(p => p.box_size === 10); if (f) return f.unit_price; }
  if (type === 'boite6') { const f = customer.prices.find(p => p.box_size === 6); if (f) return f.unit_price; }
  return DEFAULT_PRICES[type];
}

interface UnifiedSale {
  id: string; type: SaleType; sale_date: string; label: string;
  quantity: number; unit_price: number; total_amount: number;
  amount_paid: number; is_paid: boolean; notes?: string;
  raw: BulkSale | Sale | ShopSale;
}

interface GroupedSale {
  id: string;
  sale_date: string;
  items: UnifiedSale[];
  productSummary: string;
  total_quantity: number;
  total_amount: number;
  amount_paid: number;
  reste: number;
  status: 'paid' | 'unpaid' | 'partial';
}

interface SaleLineForm {
  id?: string;
  originalType?: SaleType;
  type: SaleType;
  quantity: number;
  unit_price: number;
}

export default function BulkSalesPage() {
  const { bulkSales, setBulkSales, sales, setSales, shopSales, setShopSales, customers } = useApp();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'ventes' | 'tarifs'>('ventes');
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [factureItems, setFactureItems] = useState<{ label: string; quantity: number; unit_price: number }[]>([]);
  const [factureItemForm, setFactureItemForm] = useState({ label: '', quantity: 1, unit_price: 0 });

  useEffect(() => {
    api.fiscalInfoService.get().then(setFiscalInfo).catch(() => {});
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  const customerSales = useMemo<UnifiedSale[]>(() => {
    if (!selectedCustomerId) return [];
    const result: UnifiedSale[] = [];
    bulkSales.filter(s => s.customer_id === selectedCustomerId || s.customer_name === selectedCustomer?.name).forEach(s => {
      result.push({
        id: s.id, type: 'vrac', sale_date: s.sale_date,
        label: 'Macaron en Vrac', quantity: s.quantity_kg,
        unit_price: s.price_per_kg, total_amount: s.total_amount,
        amount_paid: s.amount_paid || 0, is_paid: (s.amount_paid || 0) >= s.total_amount,
        notes: s.notes, raw: s,
      });
    });
    sales.filter(s => s.customer_id === selectedCustomerId || s.customer_name === selectedCustomer?.name).forEach(s => {
      const st: SaleType = s.box_size === 20 ? 'boite20' : s.box_size === 10 ? 'boite10' : 'boite6';
      result.push({
        id: s.id, type: st, sale_date: s.sale_date,
        label: `Boîte ${s.box_size} pcs`, quantity: s.quantity,
        unit_price: s.unit_price, total_amount: s.total_amount,
        amount_paid: s.amount_paid || 0, is_paid: s.is_paid,
        notes: s.notes, raw: s,
      });
    });
    shopSales.filter(s => s.customer_id === selectedCustomerId || s.customer_name === selectedCustomer?.name).forEach(s => {
      result.push({
        id: s.id, type: 'magasin', sale_date: s.sale_date,
        label: 'Coques Magasin', quantity: s.quantity,
        unit_price: s.price_per_piece, total_amount: s.total_amount,
        amount_paid: s.amount_paid || 0, is_paid: s.is_paid,
        notes: s.notes, raw: s,
      });
    });
    return result.sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  }, [selectedCustomerId, bulkSales, sales, shopSales, selectedCustomer]);

  const customerStats = useMemo(() => {
    const totalAchats = customerSales.reduce((s, x) => s + x.total_amount, 0);
    const totalPaye = customerSales.reduce((s, x) => s + x.amount_paid, 0);
    const totalReste = totalAchats - totalPaye;
    return { totalAchats, totalPaye, totalReste, count: customerSales.length };
  }, [customerSales]);

  const allCustomerStats = useMemo(() => {
    const map: Record<string, { total: number; paid: number; reste: number; count: number }> = {};
    const addSale = (cid: string | undefined, cname: string | undefined, total: number, paid: number) => {
      const key = cid || cname || '';
      if (!key) return;
      if (!map[key]) map[key] = { total: 0, paid: 0, reste: 0, count: 0 };
      map[key].total += total;
      map[key].paid += paid;
      map[key].reste = map[key].total - map[key].paid;
      map[key].count++;
    };
    bulkSales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));
    sales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));
    shopSales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));
    return map;
  }, [bulkSales, sales, shopSales]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [customers, search]);

  // Group sales by date for display
  const groupedSales = useMemo<GroupedSale[]>(() => {
    const map = new Map<string, UnifiedSale[]>();
    for (const s of customerSales) {
      const existing = map.get(s.sale_date);
      if (existing) {
        existing.push(s);
      } else {
        map.set(s.sale_date, [s]);
      }
    }
    const groups: GroupedSale[] = [];
    map.forEach((items, dateKey) => {
      const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const total_amount = items.reduce((sum, item) => sum + item.total_amount, 0);
      const amount_paid = items.reduce((sum, item) => sum + item.amount_paid, 0);
      const reste = Math.max(0, total_amount - amount_paid);
      const productSummary = items
        .map(item => `${item.label} x${item.quantity}${item.type === 'vrac' ? ' kg' : ''}`)
        .join(' · ');
      const status: 'paid' | 'unpaid' | 'partial' =
        reste <= 0 ? 'paid' : amount_paid <= 0 ? 'unpaid' : 'partial';

      groups.push({
        id: dateKey,
        sale_date: dateKey,
        items,
        productSummary,
        total_quantity,
        total_amount,
        amount_paid,
        reste,
        status,
      });
    });
    return groups.sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  }, [customerSales]);

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const toggleExpand = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // Sale modal state — multi-line
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupedSale | null>(null);
  const [saleLines, setSaleLines] = useState<SaleLineForm[]>([]);
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
  const [amountPaid, setAmountPaid] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [savingSale, setSavingSale] = useState(false);

  function openAddSale() {
    setEditGroup(null);
    setSaleDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentStatus('unpaid');
    setAmountPaid(0);
    setSaleNotes('');
    setSaleLines([{ type: 'boite20', quantity: 1, unit_price: getCustomerPrice(selectedCustomer, 'boite20') }]);
    setShowSaleModal(true);
  }

  function openEditGroup(group: GroupedSale) {
    setEditGroup(group);
    setSaleDate(group.sale_date);
    setPaymentStatus(group.status);
    setAmountPaid(group.amount_paid);
    const existingNotes = group.items.map(i => i.notes).filter(Boolean).join(' | ');
    setSaleNotes(existingNotes);
    setSaleLines(group.items.map(item => ({
      id: item.id,
      originalType: item.type,
      type: item.type,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })));
    setShowSaleModal(true);
  }

  function addSaleLine() {
    const lastType = saleLines[saleLines.length - 1]?.type || 'boite20';
    setSaleLines([...saleLines, { type: lastType, quantity: 1, unit_price: getCustomerPrice(selectedCustomer, lastType) }]);
  }

  function updateSaleLine(idx: number, field: 'type' | 'quantity' | 'unit_price', value: string | number) {
    setSaleLines(lines => lines.map((l, i) => {
      if (i !== idx) return l;
      if (field === 'type') {
        const newType = value as SaleType;
        return { ...l, type: newType, unit_price: getCustomerPrice(selectedCustomer, newType) };
      }
      if (field === 'quantity') return { ...l, quantity: parseFloat(String(value)) || 0 };
      return { ...l, unit_price: parseFloat(String(value)) || 0 };
    }));
  }

  function removeSaleLine(idx: number) {
    if (saleLines.length <= 1) return;
    setSaleLines(lines => lines.filter((_, i) => i !== idx));
  }

  const saleTotal = saleLines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
  const saleReste = paymentStatus === 'paid' ? 0 : paymentStatus === 'partial' ? Math.max(0, saleTotal - amountPaid) : saleTotal;

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || saleLines.length === 0) return;
    const total = saleTotal;
    if (total <= 0) {
      alert("Le montant total de la vente doit être supérieur à 0.");
      return;
    }
    if (paymentStatus === 'partial') {
      if (amountPaid <= 0 || amountPaid >= total) {
        alert(`Pour un versement, le montant versé doit être supérieur à 0 DA et strictement inférieur au total (${total.toLocaleString()} DA).`);
        return;
      }
    }
    const paid = paymentStatus === 'paid' ? total : paymentStatus === 'unpaid' ? 0 : amountPaid;
    const notes = saleNotes.trim() || undefined;

    // Distribute paid amount line by line
    let remainingPaid = paid;
    const linesWithPaid = saleLines.map(line => {
      const lineTotal = line.quantity * line.unit_price;
      const linePaid = Math.min(lineTotal, Math.max(0, remainingPaid));
      remainingPaid -= linePaid;
      return {
        ...line,
        lineTotal,
        linePaid,
        lineIsPaid: linePaid >= lineTotal,
      };
    });

    try {
      setSavingSale(true);
      if (editGroup) {
        const activeIds = new Set(saleLines.map(l => l.id).filter(Boolean));
        // Delete removed lines from DB
        for (const orig of editGroup.items) {
          if (!activeIds.has(orig.id)) {
            const meta = SALE_TYPES.find(t => t.id === orig.type)!;
            if (meta.table === 'bulk') await api.bulkSalesService.delete(orig.id);
            else if (meta.table === 'sales') await api.salesService.delete(orig.id);
            else await api.shopSalesService.delete(orig.id);
          }
        }

        let updatedBulk = bulkSales.filter(b => !editGroup.items.some(orig => !activeIds.has(orig.id) && orig.id === b.id));
        let updatedSales = sales.filter(s => !editGroup.items.some(orig => !activeIds.has(orig.id) && orig.id === s.id));
        let updatedShop = shopSales.filter(sh => !editGroup.items.some(orig => !activeIds.has(orig.id) && orig.id === sh.id));

        const existingGroupId = (editGroup.items.find(i => 'sale_group_id' in (i.raw as any))?.raw as Sale | undefined)?.sale_group_id;
        const groupId = existingGroupId || `sale-${Date.now()}`;

        for (const line of linesWithPaid) {
          const meta = SALE_TYPES.find(t => t.id === line.type)!;
          const common = {
            sale_date: saleDate,
            amount_paid: line.linePaid,
            notes,
          };

          if (line.id && line.originalType === line.type) {
            if (meta.table === 'bulk') {
              const res = await api.bulkSalesService.update(line.id, {
                ...common,
                quantity_kg: line.quantity,
                price_per_kg: line.unit_price,
                total_amount: line.lineTotal,
              });
              updatedBulk = updatedBulk.map(b => b.id === line.id ? res : b);
            } else if (meta.table === 'sales') {
              const boxSize = line.type === 'boite20' ? 20 : line.type === 'boite10' ? 10 : 6;
              const res = await api.salesService.update(line.id, {
                ...common,
                box_size: boxSize,
                quantity: line.quantity,
                unit_price: line.unit_price,
                total_amount: line.lineTotal,
                is_paid: line.lineIsPaid,
              });
              updatedSales = updatedSales.map(s => s.id === line.id ? res : s);
            } else {
              const res = await api.shopSalesService.update(line.id, {
                ...common,
                quantity: line.quantity,
                price_per_piece: line.unit_price,
                total_amount: line.lineTotal,
                is_paid: line.lineIsPaid,
              });
              updatedShop = updatedShop.map(sh => sh.id === line.id ? res : sh);
            }
          } else {
            // Type changed: delete from old table if had an id
            if (line.id && line.originalType && line.originalType !== line.type) {
              const oldMeta = SALE_TYPES.find(t => t.id === line.originalType)!;
              if (oldMeta.table === 'bulk') {
                await api.bulkSalesService.delete(line.id);
                updatedBulk = updatedBulk.filter(b => b.id !== line.id);
              } else if (oldMeta.table === 'sales') {
                await api.salesService.delete(line.id);
                updatedSales = updatedSales.filter(s => s.id !== line.id);
              } else {
                await api.shopSalesService.delete(line.id);
                updatedShop = updatedShop.filter(sh => sh.id !== line.id);
              }
            }

            // Create new
            if (meta.table === 'bulk') {
              const res = await api.bulkSalesService.create({
                ...common,
                quantity_kg: line.quantity,
                price_per_kg: line.unit_price,
                total_amount: line.lineTotal,
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
              });
              updatedBulk = [res, ...updatedBulk];
            } else if (meta.table === 'sales') {
              const boxSize = line.type === 'boite20' ? 20 : line.type === 'boite10' ? 10 : 6;
              const res = await api.salesService.create({
                ...common,
                box_size: boxSize,
                quantity: line.quantity,
                unit_price: line.unit_price,
                total_amount: line.lineTotal,
                is_paid: line.lineIsPaid,
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
                sale_group_id: groupId,
              });
              updatedSales = [res, ...updatedSales];
            } else {
              const res = await api.shopSalesService.create({
                ...common,
                quantity: line.quantity,
                price_per_piece: line.unit_price,
                total_amount: line.lineTotal,
                is_paid: line.lineIsPaid,
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
              });
              updatedShop = [res, ...updatedShop];
            }
          }
        }

        setBulkSales(updatedBulk);
        setSales(updatedSales);
        setShopSales(updatedShop);
      } else {
        const groupId = `sale-${Date.now()}`;
        const newBulk: BulkSale[] = [];
        const newSales: Sale[] = [];
        const newShop: ShopSale[] = [];

        for (const line of linesWithPaid) {
          const meta = SALE_TYPES.find(t => t.id === line.type)!;
          const common = {
            sale_date: saleDate,
            amount_paid: line.linePaid,
            notes,
          };

          if (meta.table === 'bulk') {
            const created = await api.bulkSalesService.create({
              ...common,
              quantity_kg: line.quantity,
              price_per_kg: line.unit_price,
              total_amount: line.lineTotal,
              customer_id: selectedCustomer.id,
              customer_name: selectedCustomer.name,
            });
            newBulk.push(created);
          } else if (meta.table === 'sales') {
            const boxSize = line.type === 'boite20' ? 20 : line.type === 'boite10' ? 10 : 6;
            const created = await api.salesService.create({
              ...common,
              box_size: boxSize,
              quantity: line.quantity,
              unit_price: line.unit_price,
              total_amount: line.lineTotal,
              is_paid: line.lineIsPaid,
              customer_id: selectedCustomer.id,
              customer_name: selectedCustomer.name,
              sale_group_id: groupId,
            });
            newSales.push(created);
          } else {
            const created = await api.shopSalesService.create({
              ...common,
              quantity: line.quantity,
              price_per_piece: line.unit_price,
              total_amount: line.lineTotal,
              is_paid: line.lineIsPaid,
              customer_id: selectedCustomer.id,
              customer_name: selectedCustomer.name,
            });
            newShop.push(created);
          }
        }

        if (newBulk.length) setBulkSales([...newBulk, ...bulkSales]);
        if (newSales.length) setSales([...newSales, ...sales]);
        if (newShop.length) setShopSales([...newShop, ...shopSales]);
      }
      setShowSaleModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSale(false);
    }
  };

  const handleDeleteGroup = async (group: GroupedSale) => {
    const count = group.items.length;
    const confirmMsg = count > 1
      ? `Supprimer cette vente de ${count} produits ?`
      : 'Supprimer cette vente ?';
    if (!confirm(confirmMsg)) return;

    try {
      for (const s of group.items) {
        const meta = SALE_TYPES.find(t => t.id === s.type)!;
        if (meta.table === 'bulk') {
          await api.bulkSalesService.delete(s.id);
        } else if (meta.table === 'sales') {
          await api.salesService.delete(s.id);
        } else {
          await api.shopSalesService.delete(s.id);
        }
      }
      const itemIds = new Set(group.items.map(i => i.id));
      setBulkSales(bulkSales.filter(x => !itemIds.has(x.id)));
      setSales(sales.filter(x => !itemIds.has(x.id)));
      setShopSales(shopSales.filter(x => !itemIds.has(x.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const buildDocHTML = (docType: 'bon' | 'facture', items: { label: string; quantity: number; unit_price: number; total: number }[], totalGeneral: number, verse: number) => {
    if (!selectedCustomer) return '';
    const docNum = docType === 'bon'
      ? `BC-${format(new Date(), 'yyyyMMdd')}-${Date.now().toString().slice(-4)}`
      : `FAC-${format(new Date(), 'yyyyMMdd')}-${Date.now().toString().slice(-4)}`;
    const title = docType === 'bon' ? 'BON DE COMMANDE' : 'FACTURE';
    const rows = items.map(s => {
      return `<tr><td style="padding:8px;border:1px solid #ddd">${s.label}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${s.quantity}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${s.unit_price.toLocaleString()} DA</td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">${s.total.toLocaleString()} DA</td></tr>`;
    }).join('');
    const reste = totalGeneral - verse;
    const fi = fiscalInfo;
    const fiscalBlock = fi ? `
      <div style="margin-bottom:20px;font-size:13px;color:#555">
        ${fi.company_name || ''}<br/>${fi.address || ''} ${fi.city || ''}<br/>
        ${fi.phone ? 'Tel: ' + fi.phone : ''} ${fi.email ? ' | Email: ' + fi.email : ''}<br/>
        ${fi.rc ? 'RC: ' + fi.rc : ''} ${fi.nif ? ' | NIF: ' + fi.nif : ''}<br/>
        ${fi.ai ? 'AI: ' + fi.ai : ''} ${fi.nis ? ' | NIS: ' + fi.nis : ''}<br/>
        ${fi.rib ? 'RIB: ' + fi.rib : ''}
      </div>` : '';
    return `<html><head><title>${title} ${docNum}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;max-width:800px;margin:0 auto}
      h1{color:#d97706;margin:0}h2{color:#333;margin:5px 0}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#fef3c7;padding:8px;border:1px solid #ddd;text-align:left}
      .total-row{font-weight:bold;background:#f0fdf4}
      .header{display:flex;justify-content:space-between;margin-bottom:30px}
      .info-box{background:#f9fafb;padding:15px;border-radius:8px;margin-bottom:20px}
      </style></head><body>
      <div class="header">
        <div><h1>${fi?.company_name || 'Hanky Macarons'}</h1>${fiscalBlock}</div>
        <div style="text-align:right"><h2>${title}</h2><p>N° ${docNum}</p><p>${format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p></div>
      </div>
      <div class="info-box"><strong>Client:</strong> ${selectedCustomer.name}<br/>
      ${selectedCustomer.phone ? 'Tel: ' + selectedCustomer.phone + '<br/>' : ''}
      ${selectedCustomer.address ? 'Adresse: ' + selectedCustomer.address : ''}</div>
      <table><thead><tr><th>Désignation</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix Unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total-row"><td colspan="3" style="padding:10px;border:1px solid #ddd;text-align:right">Total Général</td><td style="padding:10px;border:1px solid #ddd;text-align:right;font-size:18px">${totalGeneral.toLocaleString()} DA</td></tr>
      <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right">Versé</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#16a34a">${verse.toLocaleString()} DA</td></tr>
      <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right">Reste à Payer</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#dc2626">${reste.toLocaleString()} DA</td></tr></tfoot></table>
      <p style="margin-top:40px;font-size:12px;color:#999;text-align:center">${docType === 'facture' ? 'Facture émise conformément à la réglementation fiscale en vigueur.' : 'Bon de commande à valider par les deux parties.'}</p>
      </body></html>`;
  };

  const printHTML = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try { iframe.contentWindow?.print(); } catch (e) { console.error(e); }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  const printDocument = (docType: 'bon' | 'facture') => {
    if (!selectedCustomer || customerSales.length === 0) return;
    const items = customerSales.map(s => ({ label: s.label, quantity: s.quantity, unit_price: s.unit_price, total: s.total_amount }));
    const html = buildDocHTML(docType, items, customerStats.totalAchats, customerStats.totalPaye);
    printHTML(html);
  };

  const openFactureModal = () => {
    setFactureItems([]);
    setFactureItemForm({ label: '', quantity: 1, unit_price: 0 });
    setShowFactureModal(true);
  };

  const addFactureItem = () => {
    if (!factureItemForm.label.trim() || factureItemForm.quantity <= 0 || factureItemForm.unit_price <= 0) return;
    setFactureItems([...factureItems, { ...factureItemForm }]);
    setFactureItemForm({ label: '', quantity: 1, unit_price: 0 });
  };

  const removeFactureItem = (idx: number) => {
    setFactureItems(factureItems.filter((_, i) => i !== idx));
  };

  const printFactureFromModal = () => {
    if (factureItems.length === 0) return;
    const items = factureItems.map(it => ({ ...it, total: it.quantity * it.unit_price }));
    const total = items.reduce((s, x) => s + x.total, 0);
    const html = buildDocHTML('facture', items, total, 0);
    printHTML(html);
    setShowFactureModal(false);
  };

  // ═══════════════════════════════════════════════
  // CUSTOMER DETAIL VIEW
  // ═══════════════════════════════════════════════
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCustomerId(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Retour aux ventes
        </button>

        {/* Customer header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedCustomer.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-white/90 text-sm">
                  {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {selectedCustomer.phone}</span>}
                  {selectedCustomer.email && <span className="flex items-center gap-1"><Mail size={12} /> {selectedCustomer.email}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => printDocument('bon')}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors text-sm font-medium">
                <FileText size={16} /> Bon
              </button>
              <button onClick={openFactureModal}
                className="flex items-center gap-2 px-3 py-2 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors text-sm font-medium shadow-sm">
                <FileCheck size={16} /> Facture
              </button>
              <button onClick={openAddSale}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm">
                <Plus size={16} /> Vente
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Receipt size={14} className="text-gray-400" /><p className="text-xs text-gray-500">Transactions</p></div>
            <p className="text-2xl font-bold text-gray-900">{customerStats.count}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-gray-400" /><p className="text-xs text-gray-500">Total Achats</p></div>
            <p className="text-2xl font-bold text-gray-900">{customerStats.totalAchats.toLocaleString()} <span className="text-sm font-normal text-gray-400">DA</span></p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1"><Check size={14} className="text-emerald-500" /><p className="text-xs text-emerald-600 font-medium">Versé</p></div>
            <p className="text-2xl font-bold text-emerald-700">{customerStats.totalPaye.toLocaleString()} <span className="text-sm font-normal text-emerald-400">DA</span></p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-red-500" /><p className="text-xs text-red-600 font-medium">Reste à Payer</p></div>
            <p className="text-2xl font-bold text-red-700">{customerStats.totalReste.toLocaleString()} <span className="text-sm font-normal text-red-400">DA</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          <button onClick={() => setActiveTab('ventes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ventes' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ShoppingBag size={15} /> Ventes
          </button>
          <button onClick={() => setActiveTab('tarifs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tarifs' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Tag size={15} /> Tarifs
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'tarifs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Tag size={18} className="text-emerald-600" /> Tarifs enregistrés
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Modifiables depuis la section Clients</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {SALE_TYPES.map(t => {
                const cp = selectedCustomer.prices?.find(p => p.product_type === t.id);
                const price = cp ? Number(cp.unit_price) : DEFAULT_PRICES[t.id];
                const unitLabel = cp?.unit_label || (t.id === 'vrac' ? 'kg' : t.id === 'magasin' ? 'pcs' : 'boîte');
                const c = colorMap[t.color];
                const isCustom = cp && Number(cp.unit_price) !== DEFAULT_PRICES[t.id];
                return (
                  <div key={t.id} className={`rounded-xl p-4 border ${c.border} ${c.light} relative overflow-hidden`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 rounded-lg ${c.solid} flex items-center justify-center`}>
                        {t.icon}
                      </div>
                      {isCustom && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.solid} flex items-center gap-1`}>
                          <Sparkles size={10} /> Personnalisé
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{t.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{price.toLocaleString()} <span className="text-sm font-normal text-gray-400">DA/{unitLabel}</span></p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ventes' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Produit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qté</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Versé</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reste</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groupedSales.map(group => {
                    const isExpanded = !!expandedDates[group.sale_date];
                    return (
                      <React.Fragment key={group.id}>
                        <tr
                          onClick={() => toggleExpand(group.sale_date)}
                          className="hover:bg-gray-50 cursor-pointer select-none transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span className="text-gray-400">
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </span>
                              {format(new Date(group.sale_date), 'dd/MM/yyyy')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium text-gray-900" title={group.productSummary}>
                              {group.productSummary}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 text-sm whitespace-nowrap">
                            {group.items.length === 1 && group.items[0].type === 'vrac'
                              ? `${group.total_quantity} kg`
                              : group.items.length === 1 && group.items[0].type === 'magasin'
                              ? `${group.total_quantity} pcs`
                              : `${group.total_quantity}`}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 text-sm whitespace-nowrap">
                            {group.items.length === 1 ? group.items[0].unit_price.toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm whitespace-nowrap">
                            {group.total_amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 text-sm whitespace-nowrap">
                            {group.amount_paid.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 text-sm whitespace-nowrap">
                            {group.reste.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {group.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                <Check size={12} /> Payé
                              </span>
                            ) : group.status === 'unpaid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                <Clock size={12} /> Non payé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                <Clock size={12} /> Versement
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditGroup(group);
                                }}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(group);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Unfolded product detail */}
                        {isExpanded && (
                          <tr className="bg-gray-50/70">
                            <td colSpan={9} className="px-6 py-3">
                              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-inner">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Détail des produits ({group.items.length})
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-500 border-b border-gray-100 pb-1">
                                        <th className="text-left font-medium pb-1.5">Produit</th>
                                        <th className="text-right font-medium pb-1.5">Quantité</th>
                                        <th className="text-right font-medium pb-1.5">Prix unitaire</th>
                                        <th className="text-right font-medium pb-1.5">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {group.items.map((item, itemIdx) => {
                                        const meta = SALE_TYPES.find(t => t.id === item.type)!;
                                        const c = colorMap[meta.color];
                                        return (
                                          <tr key={itemIdx} className="hover:bg-gray-50/50">
                                            <td className="py-1.5">
                                              <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 rounded ${c.solid} flex items-center justify-center flex-shrink-0`}>
                                                  {meta.icon}
                                                </span>
                                                <span className="font-medium text-gray-800">{item.label}</span>
                                              </div>
                                            </td>
                                            <td className="py-1.5 text-right text-gray-600">
                                              {item.type === 'vrac'
                                                ? `${item.quantity} kg`
                                                : item.type === 'magasin'
                                                ? `${item.quantity} pcs`
                                                : `${item.quantity} boîte${item.quantity > 1 ? 's' : ''}`}
                                            </td>
                                            <td className="py-1.5 text-right text-gray-600">
                                              {item.unit_price.toLocaleString()} DA
                                            </td>
                                            <td className="py-1.5 text-right font-semibold text-gray-900">
                                              {item.total_amount.toLocaleString()} DA
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                {group.items.some(i => i.notes) && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 italic">
                                    <strong>Notes :</strong> {group.items.map(i => i.notes).filter(Boolean).join(' | ')}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                {groupedSales.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 font-bold text-right">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{customerStats.totalAchats.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{customerStats.totalPaye.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{customerStats.totalReste.toLocaleString()}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {groupedSales.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Aucune vente enregistrée pour ce client</p>
                <button onClick={openAddSale} className="mt-3 text-emerald-600 font-medium hover:underline">Ajouter une vente</button>
              </div>
            )}
          </div>
        )}

        {/* Facture Modal */}
        {showFactureModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileCheck size={20} className="text-emerald-600" /> Créer une Facture</h2>
                <button onClick={() => setShowFactureModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-500">Client: <strong className="text-gray-900">{selectedCustomer.name}</strong></p>
                
                {/* Add item form */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter un article</p>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input type="text" placeholder="Désignation" value={factureItemForm.label}
                        onChange={e => setFactureItemForm({ ...factureItemForm, label: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" step="0.5" placeholder="Qté" value={factureItemForm.quantity}
                        onChange={e => setFactureItemForm({ ...factureItemForm, quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" step="10" placeholder="Prix" value={factureItemForm.unit_price}
                        onChange={e => setFactureItemForm({ ...factureItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-1">
                      <button type="button" onClick={addFactureItem}
                        className="w-full h-full flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Quick fill from customer prices */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SALE_TYPES.map(t => {
                      const price = getCustomerPrice(selectedCustomer, t.id);
                      return (
                        <button key={t.id} type="button"
                          onClick={() => setFactureItemForm({ label: t.label, quantity: 1, unit_price: price })}
                          className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                          {t.shortLabel}: {price.toLocaleString()} DA
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items list */}
                {factureItems.length > 0 ? (
                  <div className="space-y-2">
                    {factureItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.quantity} × {item.unit_price.toLocaleString()} DA</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{(item.quantity * item.unit_price).toLocaleString()} DA</p>
                        <button onClick={() => removeFactureItem(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-semibold text-emerald-800">Total</span>
                      <span className="text-lg font-bold text-emerald-700">{factureItems.reduce((s, x) => s + x.quantity * x.unit_price, 0).toLocaleString()} DA</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Aucun article. Ajoutez des articles ou utilisez les boutons de tarifs ci-dessus.
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowFactureModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                  <button onClick={printFactureFromModal} disabled={factureItems.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                    <Printer size={16} /> Imprimer la Facture
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sale Modal — multi-line product table + payment status */}
        {showSaleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold">{editGroup ? "Modifier l'opération" : 'Nouvelle Vente'}</h2>
                <button onClick={() => setShowSaleModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaleSubmit} className="p-4 space-y-3">
                {/* Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" required value={saleDate} onChange={e => setSaleDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <p className="text-sm text-gray-500">Client: <strong className="text-gray-900">{selectedCustomer?.name}</strong></p>
                  </div>
                </div>

                {/* Multi-line product table */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Produits</label>
                    <button type="button" onClick={addSaleLine}
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      <Plus size={16} /> Ajouter une ligne
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Produit</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 w-20">Qté</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 w-24">Prix U.</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 w-24">Total</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {saleLines.map((line, idx) => {
                          return (
                            <tr key={idx}>
                              <td className="px-2 py-1.5">
                                <select value={line.type} onChange={e => updateSaleLine(idx, 'type', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
                                  {SALE_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" step={line.type === 'vrac' ? '0.1' : '1'} min="0" value={line.quantity}
                                  onChange={e => updateSaleLine(idx, 'quantity', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" min="0" step="10" value={line.unit_price}
                                  onChange={e => updateSaleLine(idx, 'unit_price', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-right font-bold text-amber-700 focus:ring-2 focus:ring-emerald-500" />
                              </td>
                              <td className="px-2 py-1.5 text-right text-sm font-bold text-gray-900">
                                {(line.quantity * line.unit_price).toLocaleString()}
                              </td>
                              <td className="px-1 py-1.5">
                                <button type="button" onClick={() => removeSaleLine(idx)}
                                  disabled={saleLines.length <= 1}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="Supprimer la ligne">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-2 py-2 text-right text-sm font-semibold text-gray-700">Total Général</td>
                          <td className="px-2 py-2 text-right text-base font-bold text-emerald-700">{saleTotal.toLocaleString()} DA</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment status buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Situation de paiement</label>
                  <div className="flex gap-2">
                    {(['paid', 'unpaid', 'partial'] as const).map(s => (
                      <button key={s} type="button"
                        onClick={() => {
                          setPaymentStatus(s);
                          if (s === 'paid') setAmountPaid(saleTotal);
                          else if (s === 'unpaid') setAmountPaid(0);
                          else if (amountPaid <= 0 || amountPaid >= saleTotal) {
                            setAmountPaid(Math.max(1, Math.round(saleTotal / 2)));
                          }
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          paymentStatus === s
                            ? s === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : s === 'unpaid' ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          s === 'paid' ? 'bg-emerald-500' : s === 'unpaid' ? 'bg-red-500' : 'bg-orange-500'
                        }`} />
                        {s === 'paid' ? 'Payé' : s === 'unpaid' ? 'Non payé' : 'Versement'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Partial payment amount */}
                {paymentStatus === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant versé (DA)</label>
                    <input type="number" min="1" max={Math.max(1, saleTotal - 1)}
                      value={amountPaid || ''}
                      onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                      required
                      placeholder="Saisir le montant versé"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
                    <p className="text-sm text-orange-600 mt-1">
                      Reste à payer : <strong>{saleReste.toLocaleString()} DA</strong>
                    </p>
                    {amountPaid >= saleTotal && saleTotal > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Le montant versé doit être inférieur au total ({saleTotal.toLocaleString()} DA). Sinon, choisissez « Payé ».
                      </p>
                    )}
                    {amountPaid <= 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Le montant versé doit être supérieur à 0 DA. Sinon, choisissez « Non payé ».
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                  <textarea value={saleNotes} rows={2} onChange={e => setSaleNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>

                {/* Summary */}
                <div className="bg-emerald-50 p-3 rounded-xl flex justify-between items-center text-sm">
                  <span className="text-emerald-800">Total : <strong>{saleTotal.toLocaleString()} DA</strong></span>
                  {paymentStatus === 'paid' && (
                    <span className="text-emerald-700 font-medium">Payé intégralement</span>
                  )}
                  {paymentStatus === 'partial' && (
                    <span className="text-orange-600 font-medium">Versé : {amountPaid.toLocaleString()} DA · Reste : {saleReste.toLocaleString()} DA</span>
                  )}
                  {paymentStatus === 'unpaid' && (
                    <span className="text-red-600 font-medium">Non payé : {saleTotal.toLocaleString()} DA</span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowSaleModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
                  <button type="submit" disabled={savingSale || saleLines.length === 0}
                    className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium disabled:opacity-60">
                    {savingSale ? 'Enregistrement...' : editGroup ? 'Modifier' : 'Enregistrer la vente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // CUSTOMER LIST VIEW
  // ═══════════════════════════════════════════════
  const globalTotal = Object.values(allCustomerStats).reduce((s, v) => s + v.total, 0);
  const globalReste = Object.values(allCustomerStats).reduce((s, v) => s + v.reste, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
        <p className="text-gray-500">Sélectionnez un client pour gérer ses ventes</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">CA Global</p>
              <p className="text-3xl font-bold mt-1">{globalTotal.toLocaleString()} <span className="text-sm font-normal text-white/70">DA</span></p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl"><TrendingUp size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl"><Users size={22} className="text-emerald-600" /></div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-5 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium mb-1">Reste à Encaisser</p>
              <p className="text-2xl font-bold text-red-700">{globalReste.toLocaleString()} <span className="text-sm font-normal text-red-400">DA</span></p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl"><Clock size={22} className="text-red-600" /></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input type="text" placeholder="Rechercher un client..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      {/* Customer grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Users size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucun client trouvé</p>
          <p className="text-sm mt-1">Ajoutez des clients depuis la section Clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const stats = allCustomerStats[customer.id] || allCustomerStats[customer.name] || { total: 0, paid: 0, reste: 0, count: 0 };
            return (
              <button key={customer.id} onClick={() => setSelectedCustomerId(customer.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-emerald-300 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                      {customer.name}
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500" />
                    </p>
                    {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-xs text-gray-400">Ventes</p>
                    <p className="text-sm font-bold text-gray-900">{stats.count}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg py-2">
                    <p className="text-xs text-emerald-500">Total</p>
                    <p className="text-sm font-bold text-emerald-700">{stats.total.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg py-2 ${stats.reste > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${stats.reste > 0 ? 'text-red-500' : 'text-gray-400'}`}>Reste</p>
                    <p className={`text-sm font-bold ${stats.reste > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.reste.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
