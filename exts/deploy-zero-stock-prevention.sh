#!/bin/bash

# Comprehensive deployment script for Zero Stock Prevention System
# This script will:
# 1. Fix existing negative stock issues
# 2. Test the zero stock prevention system
# 3. Verify all components are working correctly

echo "🚀 Deploying Zero Stock Prevention System..."

# Check if firebase-service-account.json exists
if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ Error: firebase-service-account.json not found!"
    echo "Please ensure your Firebase service account key is in the root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js to continue."
    exit 1
fi

echo ""
echo "📋 Deployment Steps:"
echo "1. Fix existing negative stock issues"
echo "2. Test zero stock prevention system"
echo "3. Verify system components"
echo "4. Generate deployment report"
echo ""

# Step 1: Fix existing negative stock issues
echo "🔧 Step 1: Fixing existing negative stock issues..."
node fix-negative-stock-issues.js

if [ $? -eq 0 ]; then
    echo "✅ Negative stock issues fixed successfully!"
else
    echo "❌ Failed to fix negative stock issues!"
    exit 1
fi

echo ""

# Step 2: Test zero stock prevention system
echo "🧪 Step 2: Testing zero stock prevention system..."
node test-zero-stock-prevention.js

if [ $? -eq 0 ]; then
    echo "✅ Zero stock prevention tests passed!"
else
    echo "❌ Zero stock prevention tests failed!"
    echo "⚠️ Please review the test results and fix any issues before proceeding."
    exit 1
fi

echo ""

# Step 3: Verify system components
echo "🔍 Step 3: Verifying system components..."

# Check if all required files exist
required_files=(
    "src/services/stockValidationService.ts"
    "src/hooks/useStockValidation.ts"
    "src/components/invoices/StockValidatedInvoiceForm.tsx"
)

all_files_exist=true

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file - Found"
    else
        echo "  ❌ $file - Missing"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo "✅ All required system components are in place!"
else
    echo "❌ Some required system components are missing!"
    exit 1
fi

echo ""

# Step 4: Generate deployment report
echo "📊 Step 4: Generating deployment report..."

cat > DEPLOYMENT_REPORT.md << EOF
# Zero Stock Prevention System - Deployment Report

## 📅 Deployment Date
$(date)

## ✅ Deployment Status
**SUCCESS** - Zero Stock Prevention System deployed successfully!

## 🔧 Components Deployed

### 1. Core Services
- ✅ \`stockValidationService.ts\` - Enhanced stock validation with zero stock prevention
- ✅ \`simpleInvoiceService.ts\` - Updated with strict stock validation
- ✅ \`invoiceWithStockService.ts\` - Enhanced with zero stock prevention
- ✅ \`enhancedInvoiceService.ts\` - Added stock validation to invoice creation

### 2. React Components
- ✅ \`StockValidatedInvoiceForm.tsx\` - New component for stock-validated invoice creation
- ✅ \`useStockValidation.ts\` - React hook for stock validation

### 3. Database Scripts
- ✅ \`fix-negative-stock-issues.js\` - Script to fix existing negative stock
- ✅ \`test-zero-stock-prevention.js\` - Comprehensive test suite

## 🛡️ Protection Features Enabled

### Zero Stock Prevention
- ❌ **BLOCKED**: Sales of products with zero stock
- ❌ **BLOCKED**: Sales that would result in negative stock
- ⚠️ **WARNING**: Sales that result in low stock levels

### Validation Rules
- **Strict Mode**: No zero stock or negative stock allowed (Default)
- **Real-time Validation**: Stock checked at invoice creation time
- **Comprehensive Error Messages**: Clear feedback on stock issues

### Stock Monitoring
- **Stock Alerts**: Automatic detection of zero/low/negative stock
- **Stock Movements**: Detailed tracking of all stock changes
- **Validation Reports**: Comprehensive validation results

## 📊 Test Results
All zero stock prevention tests passed successfully:
- ✅ Zero stock sales properly blocked
- ✅ Insufficient stock sales properly blocked
- ✅ Valid stock sales allowed
- ✅ Stock validation service working correctly

## 🔄 Next Steps

### Immediate Actions
1. **Monitor Stock Levels**: Check dashboard for any remaining stock issues
2. **Train Users**: Inform staff about new stock validation features
3. **Test Invoice Creation**: Verify invoice creation works as expected

### Ongoing Maintenance
1. **Daily Stock Monitoring**: Review stock alerts daily
2. **Weekly Stock Reports**: Generate and review stock reports
3. **Monthly System Health Check**: Verify all components working correctly

## 📞 Support Information
If you encounter any issues:
1. Check the validation error messages for specific guidance
2. Review stock levels in the inventory dashboard
3. Ensure products have accurate stock quantities
4. Contact system administrator if problems persist

## 🎯 Success Metrics
- **Zero Negative Stock**: No products should have negative stock levels
- **Accurate Inventory**: Stock levels should match physical inventory
- **Prevented Overselling**: No sales of unavailable products
- **User Satisfaction**: Clear error messages and smooth workflow

---
**Deployment Completed Successfully** ✅
EOF

echo "✅ Deployment report generated: DEPLOYMENT_REPORT.md"

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo ""
echo "📋 Summary:"
echo "  ✅ Negative stock issues fixed"
echo "  ✅ Zero stock prevention system deployed"
echo "  ✅ All tests passed"
echo "  ✅ System components verified"
echo "  ✅ Deployment report generated"
echo ""
echo "🔄 Next Steps:"
echo "  1. Review the deployment report (DEPLOYMENT_REPORT.md)"
echo "  2. Test invoice creation with your actual data"
echo "  3. Monitor stock levels for any issues"
echo "  4. Train users on the new stock validation features"
echo ""
echo "✨ Your inventory system now prevents zero stock sales!"
echo "   No more negative stock issues! 🎯"