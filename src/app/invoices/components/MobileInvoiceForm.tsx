"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Paper, IconButton,
  CircularProgress, Alert, Snackbar, Chip, Divider,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Badge, Card, CardContent, Zoom, Fade, Grow, Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Percent as PercentIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Note as NoteIcon,
  Inventory2 as InventoryIcon,
  Store as StoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs,
  limit, orderBy, doc as firestoreDoc, updateDoc as firestoreUpdateDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import { useParties } from "@/app/hooks/useParties";
import { useProducts } from '@/app/hooks/useProducts';
import { useCategories } from '@/app/hooks/useCategories';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import CategoryDiscountEditor from '@/components/invoices/CategoryDiscountEditor';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import StockValidationConfigService from '@/services/stockValidationConfig';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';

interface Party {
  id: string; name: string; email: string; phone: string; address: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>;
}

interface InvoiceLineItem {
  productId: string; name: string; description?: string;
  quantity: number; price: number; category: string;
  discount: number; discountType: 'none' | 'category' | 'product' | 'custom';
  finalPrice: number;
}

interface MobileInvoiceFormProps {
  onSuccess?: (invoiceId?: string) => void;
  invoiceId?: string;
}

// Color palette
const palette = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  white: '#FFFFFF',
};

// Shared styles
const styles = {
  sectionCard: {
    mx: 1.5, mb: 1.5, borderRadius: 3,
    bgcolor: palette.white,
    border: `1px solid ${palette.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  sectionHeader: (icon: React.ReactNode, color: string) => ({
    display: 'flex', alignItems: 'center', gap: 1, mb: 2,
    '& .MuiAvatar-root': { width: 32, height: 32, bgcolor: alpha(color, 0.12) },
    '& .MuiSvgIcon-root': { fontSize: 18, color },
  }),
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      bgcolor: palette.surface,
      '& fieldset': { borderColor: palette.border },
      '&:hover fieldset': { borderColor: palette.primary },
      '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 },
    },
  },
  chip: (bg: string, fg: string) => ({
    bgcolor: bg, color: fg, fontWeight: 600, borderRadius: 1.5,
    fontSize: '0.7rem', height: 22, '& .MuiChip-label': { px: 1 },
  }),
  btnPrimary: {
    borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
    bgcolor: palette.primary, boxShadow: `0 2px 8px ${alpha(palette.primary, 0.3)}`,
    '&:hover': { bgcolor: palette.primaryDark, boxShadow: `0 4px 12px ${alpha(palette.primary, 0.4)}` },
  },
  btnOutline: {
    borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
    border: `1.5px solid ${palette.border}`, color: palette.text,
    '&:hover': { borderColor: palette.primary, bgcolor: palette.primaryLight },
  },
};

export default function MobileInvoiceForm({ onSuccess, invoiceId }: MobileInvoiceFormProps) {
  const router = useRouter();
  const { parties, loading: loadingParties } = useParties();
  const { products, loading: loadingProducts } = useProducts();
  const { categories } = useCategories();
  const { userId } = useCurrentUser();

  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [invoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [showTotals, setShowTotals] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [pendingQtyProduct, setPendingQtyProduct] = useState<InvoiceLineItem | null>(null);
  const [pendingQty, setPendingQty] = useState<number>(1);

  const [openPartyDialog, setOpenPartyDialog] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [creatingParty, setCreatingParty] = useState(false);

  const [openCategoryDiscountEditor, setOpenCategoryDiscountEditor] = useState(false);

  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [newProductCategory, setNewProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const selectedParty = parties.find(p => p.id === selectedPartyId) || null;

  const availableCategories = useMemo(() => {
    const names = new Set<string>();
    categories.forEach(c => { if (c.name) names.add(c.name); });
    products.forEach(p => { if (p.category) names.add(p.category); });
    return Array.from(names).sort();
  }, [categories, products]);

  // Generate invoice number
  useEffect(() => {
    if (invoiceId) return;
    const generateInvoiceNumber = async () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      try {
        const result = await executeWithRetry(async () => {
          const q = query(
            collection(db, 'invoices'),
            where('invoiceNumber', '>=', `INV-${year}${month}-000`),
            where('invoiceNumber', '<=', `INV-${year}${month}-999`),
            orderBy('invoiceNumber', 'desc'), limit(1)
          );
          const snap = await getDocs(q);
          let seq = 1;
          if (!snap.empty) {
            const currentSeq = parseInt(snap.docs[0].data().invoiceNumber.split('-')[2]);
            seq = Math.min(currentSeq + 1, 999);
          }
          return `INV-${year}${month}-${seq.toString().padStart(3, '0')}`;
        });
        if (result) setInvoiceNumber(result);
      } catch { setInvoiceNumber(`INV-${Date.now()}`); }
    };
    generateInvoiceNumber();
  }, [invoiceId]);

  // Discount calculation - applies party category discounts
  const calculateItemDiscounts = useCallback((item: InvoiceLineItem, party: Party | null) => {
    if (!party) return item;
    const product = products.find(p => p.id === item.productId);
    if (!product) return item;
    const catDiscount = party.categoryDiscounts[product.category] || 0;
    const discount = catDiscount;
    const discountType = discount > 0 ? 'category' as const : 'none' as const;
    return {
      ...item,
      discount,
      discountType,
      finalPrice: parseFloat((item.price * (1 - discount / 100) * item.quantity).toFixed(2)),
    };
  }, [products]);

  // Recalculate when party changes
  useEffect(() => {
    if (!selectedParty) {
      // No party: reset all discounts
      setLineItems(prev => prev.map(item => ({
        ...item,
        discount: 0,
        discountType: 'none' as const,
        finalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
      })));
      return;
    }
    setLineItems(prev => prev.map(item => calculateItemDiscounts(item, selectedParty)));
  }, [selectedPartyId, calculateItemDiscounts]);

  const qtyInputRef = React.useRef<HTMLInputElement>(null);

  // Add product — with explicit qty flow
  const handleAddProduct = () => {
    if (!selectedProductId) return;
    if (lineItems.length >= 25) { setWarningMessage('Max 25 items per invoice'); return; }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
    if (selectedParty) {
      const cd = selectedParty.categoryDiscounts[product.category] || 0;
      if (cd > 0) { discount = cd; discountType = 'category'; }
    }
    const newItem: InvoiceLineItem = {
      productId: product.id, name: product.name, quantity: 1,
      price: product.price, category: product.category || '',
      discount, discountType,
      finalPrice: parseFloat((product.price * (1 - discount / 100)).toFixed(2)),
    };
    setPendingQtyProduct(newItem);
    setPendingQty(1);
    setProductSearchOpen(false);
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 100);
  };

  const confirmPendingQty = () => {
    if (!pendingQtyProduct) return;
    const qty = Math.max(1, pendingQty);
    const updatedItem = calculateItemDiscounts(
      { ...pendingQtyProduct, quantity: qty },
      selectedParty
    );
    setLineItems(prev => [updatedItem, ...prev]);
    setPendingQtyProduct(null);
    setPendingQty(1);
    setSelectedProductId('');
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('#product-search-input');
      if (input) input.focus();
    }, 50);
  };

  const cancelPendingQty = () => {
    setPendingQtyProduct(null);
    setPendingQty(1);
    setSelectedProductId('');
    setProductSearchOpen(true);
  };

  const handleUpdateQuantity = (index: number, qty: number) =>
    setLineItems(prev => prev.map((item, i) => i === index
      ? calculateItemDiscounts({ ...item, quantity: Math.max(1, qty) }, selectedParty)
      : item));

  const handleUpdatePrice = (index: number, price: number) =>
    setLineItems(prev => prev.map((item, i) => i === index
      ? calculateItemDiscounts({ ...item, price: Math.max(0, price) }, selectedParty)
      : item));

  const handleRemoveItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

  const handleUpdateCategoryDiscounts = async (updatedDiscounts: Record<string, number>) => {
    if (!selectedParty) return;
    // Apply changes locally first (immediate feedback for current session)
    const idx = parties.findIndex(p => p.id === selectedParty.id);
    if (idx !== -1) {
      parties[idx] = { ...selectedParty, categoryDiscounts: updatedDiscounts };
    }
    setLineItems(prev => prev.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && updatedDiscounts.hasOwnProperty(product.category)) {
        const d = updatedDiscounts[product.category];
        return {
          ...item, discount: d, discountType: 'category' as const,
          finalPrice: parseFloat((item.price * (1 - d / 100) * item.quantity).toFixed(2)),
        };
      }
      return {
        ...item, discount: 0, discountType: 'none' as const,
        finalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
      };
    }));
    setSuccessMessage('Discounts applied');
    // Try Firestore persistence — non-blocking
    try {
      setLoading(true);
      await firestoreUpdateDoc(firestoreDoc(db, 'parties', selectedParty.id), {
        categoryDiscounts: updatedDiscounts,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Persistence failed, but local changes are applied — show warning
      setWarningMessage('Discounts applied for this session only (sync failed)');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParty = async () => {
    if (!newParty.name) { setError('Party name is required'); return; }
    try {
      setCreatingParty(true);
      const partyRef = await executeWithRetry(async () => addDoc(collection(db, 'parties'), { ...newParty, categoryDiscounts: {}, productDiscounts: {}, createdAt: serverTimestamp() }), 3);
      parties.push({ ...newParty, id: partyRef.id, categoryDiscounts: {}, productDiscounts: {} });
      setSelectedPartyId(partyRef.id);
      setOpenPartyDialog(false);
      setSuccessMessage('Party created');
    } catch (err) { setError(getFirestoreErrorMessage(err)); }
    finally { setCreatingParty(false); }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) { setError('Product name required'); return; }
    if (newProductPrice <= 0) { setError('Price must be > 0'); return; }
    try {
      setCreatingProduct(true);
      const finalCategory = useCustomCategory ? customCategory.trim() : newProductCategory;
      const productRef = await executeWithRetry(async () => addDoc(collection(db, 'products'), { name: newProductName.trim(), price: newProductPrice, category: finalCategory, categoryName: finalCategory, quantity: newProductStock, stock: newProductStock, isActive: true, gstRate: 18, unitOfMeasurement: 'PCS', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }), 3);
      products.push({ id: productRef.id, name: newProductName.trim(), price: newProductPrice, category: finalCategory });
      let discount = 0;
      let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
      if (selectedParty && finalCategory) {
        const cd = selectedParty.categoryDiscounts[finalCategory] || 0;
        if (cd > 0) { discount = cd; discountType = 'category'; }
      }
      setLineItems(prev => [{ productId: productRef.id, name: newProductName.trim(), quantity: 1, price: newProductPrice, category: finalCategory, discount, discountType, finalPrice: parseFloat((newProductPrice * (1 - discount / 100)).toFixed(2)) }, ...prev]);
      setOpenProductDialog(false);
      setSuccessMessage('Product created & added');
    } catch (err) { setError(getFirestoreErrorMessage(err)); }
    finally { setCreatingProduct(false); }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal - lineItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const total = Math.round(subtotal - discountAmount + transportCharges);

  const handleSaveInvoice = async () => {
    if (!selectedPartyId || lineItems.length === 0) { setError('Select a party and add at least one product'); return; }
    setLoading(true);
    setError(null);
    try {
      const invoiceData: any = {
        invoiceNumber, date: invoiceDate,
        partyId: selectedParty?.id || '', partyName: selectedParty?.name || '',
        partyAddress: selectedParty?.address || '', partyEmail: selectedParty?.email || '',
        partyPhone: selectedParty?.phone || '', partyGstin: (selectedParty as any)?.gstin || '',
        userId: userId || 'default-user', type: 'sales',
        items: lineItems.map(item => ({
          productId: item.productId, name: item.name,
          description: item.description || '', quantity: item.quantity,
          price: item.price, discount: item.discount, discountType: item.discountType,
          finalPrice: item.finalPrice, category: item.category
        })),
        subtotal, discount: discountAmount, total, transportCharges, notes,
        categoryDiscounts: selectedParty?.categoryDiscounts || {},
        isGstInvoice: false, stockUpdated: false
      };
      const stockConfig = StockValidationConfigService.getConfigForInvoiceType('sales');
      const createResult = await CentralizedInvoiceService.createInvoice(invoiceData, stockConfig);
      if (!createResult.success) { setError(createResult.blockingErrors?.join('\n') || createResult.errors?.join(', ') || 'Failed'); return; }
      setSuccessMessage('Invoice created successfully!');
      setTimeout(() => { if (onSuccess) onSuccess(createResult.invoiceId); else router.push('/invoices'); }, 1200);
    } catch (err) { setError(getFirestoreErrorMessage(err)); }
    finally { setLoading(false); }
  };

  // ---- RENDER ----
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', pb: 20, bgcolor: palette.surface, minHeight: '100vh' }}>
      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mx: 1.5, mt: 1, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage(null)} message={successMessage} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: 100 }} />
      <Snackbar open={!!warningMessage} autoHideDuration={4000} onClose={() => setWarningMessage(null)} message={warningMessage} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />

      {/* --- HEADER --- */}
      <Box sx={{ px: 2, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: palette.primary, boxShadow: `0 2px 8px ${alpha(palette.primary, 0.35)}` }}>
          <ReceiptIcon sx={{ fontSize: 22 }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} color={palette.text} lineHeight={1.2}>
            New Invoice
          </Typography>
          <Typography variant="caption" color={palette.textSecondary}>
            {new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
        {invoiceNumber && (
          <Chip label={`#${invoiceNumber.split('-').pop()}`} size="small" sx={styles.chip(palette.primaryLight, palette.primary)} />
        )}
      </Box>

      {/* --- PARTY SECTION --- */}
      <Paper variant="outlined" sx={styles.sectionCard}>
        <Box sx={{ p: 2 }}>
          <Box sx={styles.sectionHeader(<PersonIcon />, palette.primary)}>
            <Avatar><PersonIcon /></Avatar>
            <Typography variant="subtitle2" fontWeight={700} color={palette.text}>Customer / Party</Typography>
            {selectedParty && <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Selected" size="small" sx={styles.chip(palette.successLight, palette.success)} />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Autocomplete
              fullWidth options={parties} getOptionLabel={(o) => o.name}
              value={selectedParty} onChange={(_, v) => setSelectedPartyId(v?.id || '')}
              disabled={loadingParties} size="small"
              renderInput={(params) => (
                <TextField {...params} placeholder="Search by name, phone or email..."
                  sx={styles.input}
                  InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><PersonIcon sx={{ color: palette.textSecondary, fontSize: 18 }} /></InputAdornment>) }}
                />
              )}
              filterOptions={(options, state) => {
                const v = state.inputValue.toLowerCase().trim();
                return options.filter(o => o.name.toLowerCase().includes(v) || (o.phone?.includes(v)) || (o.email?.toLowerCase().includes(v)));
              }}
              loading={loadingParties}
            />
            <Button variant="outlined" onClick={() => setOpenPartyDialog(true)} sx={{ ...styles.btnOutline, minWidth: 44, px: 1.5, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
              + New
            </Button>
          </Box>
          {selectedParty && (
            <Fade in>
              <Box sx={{ mt: 2, p: 1.5, bgcolor: palette.surfaceAlt, borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700} color={palette.text}>{selectedParty.name}</Typography>
                {selectedParty.phone && <Chip icon={<PersonIcon sx={{ fontSize: 14 }} />} label={selectedParty.phone} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />}
                <Badge badgeContent={Object.keys(selectedParty.categoryDiscounts).filter(k => selectedParty.categoryDiscounts[k] > 0).length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                  <Button size="small" variant="outlined" onClick={() => setOpenCategoryDiscountEditor(true)} sx={{ ...styles.btnOutline, fontSize: '0.7rem', py: 0.3 }}>
                    <PercentIcon sx={{ fontSize: 16, mr: 0.3 }} /> Discounts
                  </Button>
                </Badge>
              </Box>
            </Fade>
          )}
          {/* Active discount chips */}
          {selectedParty && Object.keys(selectedParty.categoryDiscounts).filter(k => selectedParty.categoryDiscounts[k] > 0).length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
              {Object.entries(selectedParty.categoryDiscounts).map(([cat, d]) => d > 0 && (
                <Chip key={cat} label={`${cat} ${d}%`} size="small" sx={styles.chip(palette.accentLight, palette.accent)} />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* --- ADD PRODUCT SECTION --- */}
      <Paper variant="outlined" sx={styles.sectionCard}>
        <Box sx={{ p: 2 }}>
          <Box sx={styles.sectionHeader(<CartIcon />, palette.accent)}>
            <Avatar><CartIcon /></Avatar>
            <Typography variant="subtitle2" fontWeight={700} color={palette.text}>Add Products</Typography>
            {lineItems.length > 0 && <Chip label={`${lineItems.length} item${lineItems.length > 1 ? 's' : ''}`} size="small" sx={styles.chip(palette.primaryLight, palette.primary)} />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Autocomplete
              open={productSearchOpen} onOpen={() => setProductSearchOpen(true)} onClose={() => setProductSearchOpen(false)}
              options={products} getOptionLabel={(p) => p.name}
              value={products.find(p => p.id === selectedProductId) || null}
              onChange={(_, p) => { setSelectedProductId(p?.id || ''); if (p?.id) setProductSearchOpen(false); }}
              disabled={loadingProducts} size="small"
              sx={{ minWidth: 180, flex: 1 }}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                    {option.category && <Typography variant="caption" color={palette.textSecondary}>{option.category}</Typography>}
                  </Box>
                  <Typography variant="body2" fontWeight={700} color={palette.primary}>₹{option.price}</Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField {...params} placeholder="Search product..."
                  sx={styles.input}
                  InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><InventoryIcon sx={{ color: palette.textSecondary, fontSize: 18 }} /></InputAdornment>) }}
                />
              )}
              loading={loadingProducts}
              noOptionsText={
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color={palette.textSecondary} gutterBottom>No products found</Typography>
                  <Button size="small" variant="contained" onClick={() => { setOpenProductDialog(true); setProductSearchOpen(false); }} sx={styles.btnPrimary}>Create Product</Button>
                </Box>
              }
            />
            <Button variant="contained" onClick={handleAddProduct} disabled={!selectedProductId} sx={{ ...styles.btnPrimary, minWidth: 48, height: 40, px: 1 }}>
              <AddIcon sx={{ fontSize: 20 }} />
            </Button>
            <Button variant="outlined" onClick={() => setOpenProductDialog(true)} sx={{ ...styles.btnOutline, height: 40, fontSize: '0.75rem' }}>
              + Product
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* --- QTY PROMPT --- */}
      {pendingQtyProduct && (
        <Fade in>
          <Paper variant="outlined" sx={{
            mx: 1.5, mb: 1.5, p: 2, borderRadius: 3,
            border: `2px solid ${palette.primary}`,
            bgcolor: palette.primaryLight,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: palette.primary, fontSize: '0.75rem', fontWeight: 700 }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="body2" fontWeight={700} color={palette.primary}>
                Quantity for {pendingQtyProduct.name}
              </Typography>
              <Chip label={`₹${pendingQtyProduct.price}`} size="small" sx={styles.chip(palette.accentLight, palette.accent)} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                type="number" size="small" placeholder="Enter qty..."
                value={pendingQty} onChange={(e) => setPendingQty(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') confirmPendingQty(); if (e.key === 'Escape') cancelPendingQty(); }}
                inputRef={qtyInputRef}
                sx={{ flex: 1, ...styles.input }}
              />
              <Button variant="outlined" onClick={cancelPendingQty}
                sx={{ ...styles.btnOutline, height: 40, minWidth: 44 }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </Button>
              <Button variant="contained" onClick={confirmPendingQty}
                sx={{ ...styles.btnPrimary, height: 40, minWidth: 60 }}>
                <CheckCircleIcon sx={{ fontSize: 20 }} />
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* --- LINE ITEMS --- */}
      {lineItems.length === 0 && !pendingQtyProduct ? (
        <Box sx={{ mx: 1.5, my: 4, py: 6, textAlign: 'center', border: `2px dashed ${palette.border}`, borderRadius: 3, bgcolor: palette.white }}>
          <InventoryIcon sx={{ fontSize: 48, color: palette.border, mb: 1.5 }} />
          <Typography variant="body2" fontWeight={600} color={palette.textSecondary} gutterBottom>No products added yet</Typography>
          <Typography variant="caption" color={palette.textSecondary}>Search a product above or tap "+ Product" to create one</Typography>
        </Box>
      ) : (
        <Box sx={{ px: 1.5 }}>
          {lineItems.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const bgColor = index % 2 === 0 ? palette.white : palette.surfaceAlt;
            return (
              <Grow in key={`${item.productId}-${index}`} timeout={200 + index * 50}>
                <Card sx={{
                  mb: 1.5, borderRadius: 3, border: `1px solid ${palette.border}`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  bgcolor: bgColor, overflow: 'visible',
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Top row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, mr: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: palette.primaryLight, color: palette.primary, fontSize: '0.75rem', fontWeight: 700 }}>
                          {index + 1}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={700} color={palette.text} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                            {item.name}
                          </Typography>
                          {product?.category && (
                            <Chip label={product.category} size="small" sx={{ ...styles.chip(palette.accentLight, palette.accent), mt: 0.3 }} />
                          )}
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: palette.danger, bgcolor: palette.dangerLight, '&:hover': { bgcolor: palette.danger, color: palette.white }, borderRadius: 1.5, width: 30, height: 30 }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>

                    {/* Price + Qty row */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <TextField type="number" size="small" label="Price" value={item.price}
                        onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }} sx={{ width: 110, ...styles.input }}
                        InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                        InputProps={{ startAdornment: <InputAdornment position="start" sx={{ '& p': { fontSize: '0.8rem' } }}>₹</InputAdornment> }}
                      />
                      <TextField type="number" size="small" label="Qty" value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }} sx={{ width: 80, ...styles.input }}
                        InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                      />
                    </Box>

                    {/* Bottom: discount badge + total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                      <Box>
                        {item.discount > 0 && (
                          <Chip
                            label={`${item.discount}% off`} size="small"
                            sx={styles.chip(palette.successLight, palette.success)}
                          />
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color={palette.textSecondary}>
                          {item.quantity} × ₹{item.price}{item.discount > 0 ? ` (-${item.discount}%)` : ''}
                        </Typography>
                        <Typography variant="body1" fontWeight={800} color={palette.primary}>
                          ₹{item.finalPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            );
          })}
        </Box>
      )}

      {/* --- EXTRAS SECTION --- */}
      {lineItems.length > 0 && (
        <Paper variant="outlined" sx={styles.sectionCard}>
          <Box sx={{ p: 2 }}>
            <Box sx={styles.sectionHeader(<NoteIcon />, palette.textSecondary)}>
              <Avatar><NoteIcon /></Avatar>
              <Typography variant="subtitle2" fontWeight={700} color={palette.text}>Additional Details</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField type="number" size="small" label="Shipping / Transport" value={transportCharges}
                onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0 }} sx={{ width: 170, ...styles.input }}
                InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><ShippingIcon sx={{ fontSize: 18, color: palette.textSecondary }} /></InputAdornment>
                }}
              />
              <TextField size="small" label="Notes" value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ flex: 1, minWidth: 150, ...styles.input }}
                InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><NoteIcon sx={{ fontSize: 18, color: palette.textSecondary }} /></InputAdornment>
                }}
                placeholder="Order notes, delivery instructions..."
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* --- STICKY BOTTOM BAR --- */}
      {lineItems.length > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100,
          bgcolor: palette.white, borderTop: `1px solid ${palette.border}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', px: 2, py: 1.5, maxWidth: 560, mx: 'auto',
        }}>
          {/* Collapsible totals */}
          <Box sx={{ mb: showTotals ? 1.5 : 0, transition: 'all 0.3s ease' }}>
            <Box onClick={() => setShowTotals(!showTotals)} sx={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showTotals ? 1 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color={palette.textSecondary} fontWeight={600}>
                  {lineItems.length} item{lineItems.length > 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" color={palette.textSecondary}>• {showTotals ? 'Hide' : 'Show'} breakdown</Typography>
              </Box>
              <Typography variant="h6" fontWeight={800} color={palette.primary} sx={{ fontSize: '1.2rem' }}>
                ₹{total.toFixed(2)}
              </Typography>
            </Box>
            {showTotals && (
              <Fade in>
                <Box sx={{ bgcolor: palette.surfaceAlt, p: 1.5, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color={palette.textSecondary}>Subtotal</Typography><Typography variant="body2" fontWeight={600}>₹{subtotal.toFixed(2)}</Typography></Box>
                  {discountAmount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color={palette.success}>Discount</Typography><Typography variant="body2" fontWeight={600} color={palette.success}>-₹{discountAmount.toFixed(2)}</Typography></Box>}
                  {transportCharges > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color={palette.textSecondary}>Shipping</Typography><Typography variant="body2" fontWeight={600}>₹{transportCharges.toFixed(2)}</Typography></Box>}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" fontWeight={800}>Grand Total</Typography><Typography variant="body2" fontWeight={800} color={palette.primary}>₹{total.toFixed(2)}</Typography></Box>
                </Box>
              </Fade>
            )}
          </Box>

          <Button variant="contained" fullWidth size="large" onClick={handleSaveInvoice} disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              bgcolor: loading ? palette.textSecondary : palette.primary,
              borderRadius: 2.5, textTransform: 'none', fontWeight: 800,
              fontSize: '1rem', py: 1.5,
              boxShadow: `0 4px 16px ${alpha(palette.primary, 0.35)}`,
              '&:hover': { bgcolor: palette.primaryDark, boxShadow: `0 6px 20px ${alpha(palette.primary, 0.5)}` },
              '&:active': { transform: 'scale(0.98)' },
              '&:disabled': { bgcolor: alpha(palette.primary, 0.5) },
            }}
          >
            {loading ? 'Creating Invoice...' : `Create Invoice — ₹${total.toFixed(2)}`}
          </Button>
        </Box>
      )}

      {/* === DIALOGS === */}

      {/* Party Dialog */}
      <Dialog open={openPartyDialog} onClose={() => setOpenPartyDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${palette.border}`, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: palette.primaryLight }}><StoreIcon sx={{ fontSize: 18, color: palette.primary }} /></Avatar>
          Add New Party
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Party Name *" value={newParty.name} onChange={e => setNewParty(p => ({ ...p, name: e.target.value }))} fullWidth size="small" sx={styles.input} />
            <TextField label="Phone" value={newParty.phone} onChange={e => setNewParty(p => ({ ...p, phone: e.target.value }))} fullWidth size="small" sx={styles.input} />
            <TextField label="Email" value={newParty.email} onChange={e => setNewParty(p => ({ ...p, email: e.target.value }))} fullWidth size="small" sx={styles.input} />
            <TextField label="Address" value={newParty.address} onChange={e => setNewParty(p => ({ ...p, address: e.target.value }))} fullWidth multiline rows={2} size="small" sx={styles.input} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${palette.border}`, p: 2, gap: 1 }}>
          <Button onClick={() => setOpenPartyDialog(false)} sx={{ ...styles.btnOutline }}>Cancel</Button>
          <Button onClick={handleCreateParty} variant="contained" disabled={creatingParty || !newParty.name} sx={styles.btnPrimary}>
            {creatingParty ? <CircularProgress size={20} color="inherit" /> : 'Create Party'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${palette.border}`, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: palette.accentLight }}><InventoryIcon sx={{ fontSize: 18, color: palette.accent }} /></Avatar>
          Add New Product
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Product Name *" value={newProductName} onChange={e => setNewProductName(e.target.value)} fullWidth size="small" sx={styles.input} />
            <TextField label="Price (₹)" type="number" value={newProductPrice} onChange={e => setNewProductPrice(parseFloat(e.target.value) || 0)} fullWidth size="small" inputProps={{ min: 0, step: 0.01 }} sx={styles.input} />
            <TextField label="Initial Stock" type="number" value={newProductStock} onChange={e => setNewProductStock(parseInt(e.target.value) || 0)} fullWidth size="small" inputProps={{ min: 0 }} sx={styles.input} />
            {!useCustomCategory && (
              <Autocomplete options={availableCategories} value={newProductCategory || null}
                onChange={(_, v) => setNewProductCategory(v || '')}
                renderInput={(params) => <TextField {...params} label="Category" size="small" sx={styles.input} />}
                freeSolo
              />
            )}
            <Box
              onClick={() => setUseCustomCategory(!useCustomCategory)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, cursor: 'pointer', bgcolor: useCustomCategory ? palette.primaryLight : palette.surfaceAlt, border: `1px solid ${useCustomCategory ? palette.primary : palette.border}`, transition: 'all 0.2s' }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: useCustomCategory ? palette.primary : palette.textSecondary, fontSize: '0.7rem' }}>
                {useCustomCategory ? '✓' : '+'}
              </Avatar>
              <Typography variant="body2" fontWeight={600} color={useCustomCategory ? palette.primary : palette.textSecondary}>Custom category</Typography>
            </Box>
            {useCustomCategory && (
              <TextField label="Category Name" value={customCategory} onChange={e => setCustomCategory(e.target.value)} fullWidth size="small" sx={styles.input} placeholder="e.g. Electronics" />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${palette.border}`, p: 2, gap: 1 }}>
          <Button onClick={() => setOpenProductDialog(false)} sx={{ ...styles.btnOutline }}>Cancel</Button>
          <Button onClick={handleCreateProduct} variant="contained" disabled={creatingProduct || !newProductName.trim() || newProductPrice <= 0} sx={styles.btnPrimary}>
            {creatingProduct ? <CircularProgress size={20} color="inherit" /> : 'Create & Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Discount Editor for Selected Party */}
      {selectedParty && (
        <CategoryDiscountEditor
          open={openCategoryDiscountEditor}
          onClose={() => setOpenCategoryDiscountEditor(false)}
          partyId={selectedParty.id}
          categoryDiscounts={selectedParty.categoryDiscounts}
          onSave={handleUpdateCategoryDiscounts}
        />
      )}
    </Box>
  );
}
