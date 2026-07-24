"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Button,
  Paper,
  IconButton,
  Stack,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Remove as RemoveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';
import { Invoice } from '@/types/invoice_no_gst';
import SimpleInvoiceService from '@/services/simpleInvoiceService';

export default function EnhancedPrintInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const autoprint = searchParams.get('autoprint') === 'true';
  const defaultCopies = Math.max(1, Math.min(10, parseInt(searchParams.get('copies') || '1')));
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [copies, setCopies] = useState(defaultCopies);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Invoice ID is missing');
          return;
        }

        const invoiceData = await SimpleInvoiceService.getInvoiceById(id as string);
        
        if (!invoiceData) {
          setError('Invoice not found');
          return;
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    setPreviewMode(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPreviewMode(true), 1000);
    }, 100);
  };

  const handleDownload = () => {
    alert('PDF download functionality will be implemented. Use the Print button to access browser print dialog.');
  };

  const handleBackNavigation = () => {
    const invoiceId = id as string;
    if (invoiceId) {
      router.push(`/invoices/${invoiceId}`);
    } else {
      router.back();
    }
  };

  const handleCopiesChange = (delta: number) => {
    setCopies(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleBackNavigation();
      } else if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [id, router]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Invoice Preview...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Invoice not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackNavigation} variant="contained">
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: previewMode ? '#f5f5f5' : 'white' }}>
      {/* Control Bar - Hidden when printing */}
      <Box className="no-print" sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: previewMode ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
      }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Back to Invoice Details (Esc)">
                <IconButton 
                  onClick={handleBackNavigation}
                  sx={{ 
                    bgcolor: 'grey.100',
                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
                  }}
                  size="large"
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Print Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invoice #{invoice.invoiceNumber} • Esc to go back • Ctrl+P to print
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Number of Copies Control */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  Copies:
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopiesChange(-1)}
                  disabled={copies <= 1}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    minWidth: 32, 
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {copies}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopiesChange(1)}
                  disabled={copies >= 10}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Button
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                variant="outlined"
                size="large"
              >
                PDF
              </Button>
              <Button
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                variant="contained"
                size="large"
                color="primary"
              >
                Print
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Invoice Preview Area */}
      <Container 
        maxWidth={false} 
        sx={{ 
          py: previewMode ? 3 : 0,
          px: previewMode ? 2 : 0,
          minHeight: previewMode ? 'calc(100vh - 80px)' : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: previewMode ? 'transparent' : 'white',
          '@media print': {
            py: 0,
            px: 0,
            minHeight: '100vh',
            height: '100vh'
          }
        }}
      >
        <Paper 
          elevation={previewMode ? 8 : 0}
          sx={{ 
            position: 'relative',
            width: previewMode ? '8.5in' : '100%',
            minHeight: previewMode ? '11in' : '100vh',
            bgcolor: 'white',
            '@media print': {
              transform: 'none',
              width: '100%',
              height: '100vh',
              minHeight: '100vh',
              boxShadow: 'none',
              border: 'none'
            }
          }}
        >
          {/* Invoice Content */}
          <Box 
            className="invoice-print-container"
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              p: previewMode ? 2 : 0,
              '@media print': {
                p: 0,
                height: '100vh'
              }
            }}
          >
            {Array.from({ length: copies }).map((_, idx) => (
              <Fade key={idx} in={true} timeout={(idx + 1) * 200}>
                <Box 
                  className="invoice-copy"
                  sx={{ 
                    mb: idx < copies - 1 ? (previewMode ? 3 : 0) : 0,
                    flex: copies === 1 ? 1 : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    '@media print': {
                      mb: 0,
                      pageBreakAfter: idx < copies - 1 ? 'always' : 'auto'
                    }
                  }}
                >
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <ClassicInvoiceTemplate 
                      invoice={invoice}
                      settings={{
                        paperSize: 'A4',
                        orientation: 'portrait',
                        colorMode: 'color',
                        marginType: 'normal',
                        fontSize: 'normal',
                        compactMode: false,
                        singlePageOptimization: true,
                        autoScale: true,
                        printQuality: 'high'
                      }}
                      previewMode={previewMode}
                      copyLabel={copies === 1 ? 'Original for Recipient' : (
                        ['Original for Recipient', 'Duplicate for Supplier', 'Triplicate for Transporter'][idx] ?? `Copy ${idx + 1}`
                      )}
                    />
                  </Box>
                </Box>
              </Fade>
            ))}
          </Box>
        </Paper>
      </Container>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .invoice-print-container {
            width: 100% !important;
            height: 100vh !important;
            padding: 0 !important;
          }
          
          .invoice-copy {
            height: ${copies === 1 ? '100vh' : 'auto'} !important;
            margin-bottom: 0 !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        .invoice-print-container {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
      `}</style>
    </Box>
  );
}
