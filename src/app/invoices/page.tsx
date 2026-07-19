"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Tooltip,
  alpha,
  Divider,
  useTheme,
  Card,
  CardContent,
  Avatar,
  Grid,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Search,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutlined,
  PrintOutlined,
  MoreVert,
  ReceiptLong,
  Receipt,
  CurrencyRupee,
  PendingActions,
  CheckCircle,
  ErrorOutline,
  FilePresent,
  ChevronLeft,
  ChevronRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import { invoiceService } from "@/services/invoiceService";
import { VisuallyEnhancedDashboardLayout } from "@/components/ModernLayout";

interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  party?: { name?: string; phone?: string } | null;
  partyName?: string;
  partyPhone?: string;
  customer?: { name?: string; phone?: string } | null;
  date?: string;
  saleDate?: string;
  createdAt?: string;
  total?: number;
  totalAmount?: number;
  status?: string;
}

const PAGE_SIZE = 25;

export default function InvoicesPage() {
  const router = useRouter();
  const theme = useTheme();

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuInvoice, setMenuInvoice] = useState<InvoiceItem | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await invoiceService.getInvoices();
        if (!mounted) return;
        const sorted = [...list].sort((a: InvoiceItem, b: InvoiceItem) => {
          const da = new Date(a.date || a.saleDate || a.createdAt || 0).getTime();
          const db = new Date(b.date || b.saleDate || b.createdAt || 0).getTime();
          return db - da;
        });
        setInvoices(sorted);
        setError(null);
      } catch {
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => (i.status || "pending").toLowerCase() === "paid").length;
    const pending = invoices.filter((i) => (i.status || "pending").toLowerCase() === "pending").length;
    const overdue = invoices.filter((i) => (i.status || "").toLowerCase() === "overdue").length;
    const totalValue = invoices.reduce(
      (sum, i) => sum + (i.total ?? i.totalAmount ?? 0),
      0
    );
    return { total, paid, pending, overdue, totalValue };
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const number = (inv.invoiceNumber || inv.invoiceId || "").toString().toLowerCase();
      const party = (inv.party?.name || inv.partyName || "").toLowerCase();
      return number.includes(q) || party.includes(q);
    });
  }, [invoices, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d.getTime())
      ? "-"
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatAmount = (n?: number) => {
    const v = typeof n === "number" ? n : 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  };

  const handleNewInvoice = () => router.push("/invoices/new");
  const handleView = (inv: InvoiceItem) => {
    const id = inv.id || inv.invoiceId || inv.invoiceNumber;
    if (id) router.push(`/invoices/${id}`);
  };
  const handleEdit = (inv: InvoiceItem) => {
    const id = inv.id || inv.invoiceId || inv.invoiceNumber;
    if (id) router.push(`/invoices/${id}/edit`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, inv: InvoiceItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuInvoice(inv);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  const statCards = [
    {
      label: "Total Invoices",
      value: stats.total.toLocaleString(),
      icon: <ReceiptLong />,
      color: theme.palette.primary.main,
    },
    {
      label: "Total Value",
      value: formatAmount(stats.totalValue),
      icon: <CurrencyRupee />,
      color: theme.palette.info.main,
    },
    {
      label: "Paid",
      value: stats.paid.toString(),
      icon: <CheckCircle />,
      color: theme.palette.success.main,
    },
    {
      label: "Pending",
      value: stats.pending.toString(),
      icon: <PendingActions />,
      color: theme.palette.warning.main,
    },
    {
      label: "Overdue",
      value: stats.overdue.toString(),
      icon: <ErrorOutline />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <VisuallyEnhancedDashboardLayout
      title="Invoices"
      pageType="invoices"
      enableVisualEffects={true}
      enableParticles={false}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
        {/* Page Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 42,
                height: 42,
              }}
            >
              <Receipt />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Invoices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and track all invoices
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleNewInvoice}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 3,
            }}
          >
            New Invoice
          </Button>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map((card, idx) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={idx}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  background: alpha(card.color, 0.04),
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha(card.color, 0.12)}`,
                    borderColor: alpha(card.color, 0.3),
                  },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(card.color, 0.12),
                        color: card.color,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Search by invoice # or party name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 320,
              gap: 2,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Loading invoices...
            </Typography>
          </Box>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              bgcolor: alpha(theme.palette.error.main, 0.04),
            }}
          >
            <Typography color="error" fontWeight={500}>
              {error}
            </Typography>
          </Paper>
        ) : (
          <>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                overflow: "hidden",
              }}
            >
              <Table sx={{ minWidth: 600 }} aria-label="invoices">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Party</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageItems.map((inv, idx) => {
                    const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    const id = inv.id || inv.invoiceId || inv.invoiceNumber || `row-${idx}`;
                    return (
                      <TableRow
                        key={id}
                        hover
                        sx={{
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => handleView(inv)}
                      >
                        <TableCell sx={{ color: "text.secondary", width: 40 }}>
                          {rowNum}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {inv.invoiceNumber || inv.invoiceId || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {inv.party?.name || inv.partyName || "-"}
                            </Typography>
                            {(inv.party?.phone || inv.partyPhone) && (
                              <Typography variant="caption" color="text.secondary">
                                {inv.party?.phone || inv.partyPhone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(inv.date || inv.saleDate || inv.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>
                            {formatAmount(inv.total ?? inv.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, inv)}
                            sx={{
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <FilePresent
                          sx={{
                            fontSize: 56,
                            color: alpha(theme.palette.text.secondary, 0.4),
                            mb: 2,
                          }}
                        />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No invoices found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invoices.length > 0
                            ? "Try adjusting your search to see more results."
                            : "Create your first invoice to get started."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 2,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} invoices
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Tooltip title="First Page">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(1)}
                      >
                        <KeyboardDoubleArrowLeft fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Previous">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {getPageNumbers().map((p, i) =>
                    typeof p === "string" ? (
                      <Typography
                        key={`dots-${i}`}
                        variant="body2"
                        sx={{ px: 0.5, color: "text.disabled" }}
                      >
                        ...
                      </Typography>
                    ) : (
                      <Button
                        key={p}
                        size="small"
                        variant={p === currentPage ? "contained" : "text"}
                        onClick={() => setPage(p)}
                        sx={{
                          minWidth: 32,
                          px: 1,
                          fontWeight: p === currentPage ? 700 : 400,
                          color: p === currentPage ? undefined : "text.primary",
                        }}
                      >
                        {p}
                      </Button>
                    )
                  )}

                  <Tooltip title="Next">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Last Page">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(totalPages)}
                      >
                        <KeyboardDoubleArrowRight fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {filtered.length > 0 && filtered.length <= PAGE_SIZE && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5, textAlign: "right" }}
              >
                Showing all {filtered.length} invoice(s)
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: 2,
            minWidth: 160,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuInvoice) handleView(menuInvoice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuInvoice) handleEdit(menuInvoice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuInvoice) {
              const id = menuInvoice.id || menuInvoice.invoiceId || menuInvoice.invoiceNumber;
              if (id) router.push(`/invoices/${id}/print/enhanced`);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </VisuallyEnhancedDashboardLayout>
  );
}
