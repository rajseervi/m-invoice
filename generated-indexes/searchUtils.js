
// Search Utilities for Enhanced Text Search
export const searchUtils = {
  // Tokenize text for search
  tokenizeText: (text) => {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  },

  // Generate search terms for document
  generateSearchTerms: (document, textFields) => {
    const terms = new Set();
    
    textFields.forEach(field => {
      if (document[field]) {
        const tokens = searchUtils.tokenizeText(document[field]);
        tokens.forEach(token => terms.add(token));
      }
    });
    
    return Array.from(terms);
  },

  // Build search query for Firestore
  buildSearchQuery: (collection, searchTerm, additionalFilters = []) => {
    const tokens = searchUtils.tokenizeText(searchTerm);
    if (tokens.length === 0) return null;

    let query = collection;
    
    // Apply additional filters first
    additionalFilters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    // Apply search term filter
    if (tokens.length > 0) {
      query = query.where('searchTerms', 'array-contains-any', tokens.slice(0, 10)); // Limit to 10 tokens
    }
    
    return query.orderBy('createdAt', 'desc');
  },

  // Advanced search with multiple fields
  buildAdvancedSearch: (collection, searchParams) => {
    let query = collection;
    
    // Apply filters in optimal order (equality first, then ranges, then arrays)
    const filterOrder = ['equality', 'range', 'array'];
    
    filterOrder.forEach(type => {
      if (searchParams[type]) {
        searchParams[type].forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }
    });
    
    // Apply ordering
    if (searchParams.orderBy) {
      searchParams.orderBy.forEach(order => {
        query = query.orderBy(order.field, order.direction);
      });
    }
    
    // Apply pagination
    if (searchParams.limit) {
      query = query.limit(searchParams.limit);
    }
    
    if (searchParams.startAfter) {
      query = query.startAfter(searchParams.startAfter);
    }
    
    return query;
  }
};

// Collection-specific search configurations
export const SEARCH_CONFIGS = {
  "products": {
    "fields": [
      "id",
      "name",
      "description",
      "categoryId",
      "price",
      "quantity",
      "minStockLevel",
      "maxStockLevel",
      "isActive",
      "sku",
      "barcode",
      "unit",
      "gstRate",
      "hsnCode",
      "brand",
      "supplierId",
      "createdAt",
      "updatedAt",
      "createdBy",
      "tags",
      "searchTerms"
    ],
    "textFields": [
      "name",
      "description",
      "sku",
      "barcode",
      "brand",
      "tags"
    ],
    "searchPatterns": [
      {
        "fields": [
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "categoryId",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "categoryId",
          "isActive",
          "price"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "categoryId",
          "isActive",
          "quantity"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "quantity",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "price",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "supplierId",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "brand",
          "isActive",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "isActive",
          "quantity",
          "minStockLevel"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "categoryId",
          "quantity",
          "minStockLevel"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "categoryId",
          "supplierId",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "gstRate",
          "price"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      }
    ]
  },
  "parties": {
    "fields": [
      "id",
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
      "gstin",
      "panNumber",
      "isActive",
      "customerType",
      "supplierType",
      "creditLimit",
      "paymentTerms",
      "createdAt",
      "updatedAt",
      "tags",
      "searchTerms"
    ],
    "textFields": [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "gstin",
      "panNumber"
    ],
    "searchPatterns": [
      {
        "fields": [
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "customerType",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "supplierType",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "city",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "state",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "customerType",
          "supplierType"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "creditLimit",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "paymentTerms",
          "isActive",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      }
    ]
  },
  "invoices": {
    "fields": [
      "id",
      "invoiceNumber",
      "partyId",
      "userId",
      "date",
      "dueDate",
      "status",
      "totalAmount",
      "taxAmount",
      "finalAmount",
      "discountAmount",
      "paidAmount",
      "balanceAmount",
      "paymentStatus",
      "invoiceType",
      "gstType",
      "createdAt",
      "updatedAt",
      "createdBy",
      "items",
      "searchTerms"
    ],
    "textFields": [
      "invoiceNumber",
      "notes"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "partyId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "paymentStatus",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "invoiceType",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "partyId",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "date",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "dueDate",
          "paymentStatus"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "gstType",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "partyId",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "totalAmount",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "finalAmount",
          "status"
        ],
        "orders": [
          "DESC",
          "ASC"
        ]
      },
      {
        "fields": [
          "balanceAmount",
          "paymentStatus"
        ],
        "orders": [
          "DESC",
          "ASC"
        ]
      }
    ]
  },
  "purchases": {
    "fields": [
      "id",
      "purchaseNumber",
      "supplierId",
      "userId",
      "date",
      "deliveryDate",
      "status",
      "totalAmount",
      "taxAmount",
      "finalAmount",
      "discountAmount",
      "paidAmount",
      "balanceAmount",
      "paymentStatus",
      "purchaseType",
      "receivedStatus",
      "createdAt",
      "updatedAt",
      "items",
      "searchTerms"
    ],
    "textFields": [
      "purchaseNumber",
      "notes"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "supplierId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "receivedStatus",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "paymentStatus",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "purchaseType",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "supplierId",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "date",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "deliveryDate",
          "receivedStatus"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "finalAmount",
          "status"
        ],
        "orders": [
          "DESC",
          "ASC"
        ]
      },
      {
        "fields": [
          "balanceAmount",
          "paymentStatus"
        ],
        "orders": [
          "DESC",
          "ASC"
        ]
      }
    ]
  },
  "orders": {
    "fields": [
      "id",
      "orderNumber",
      "customerId",
      "userId",
      "orderDate",
      "deliveryDate",
      "status",
      "orderType",
      "priority",
      "totalAmount",
      "advanceAmount",
      "balanceAmount",
      "items",
      "createdAt",
      "updatedAt",
      "searchTerms"
    ],
    "textFields": [
      "orderNumber",
      "notes"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "customerId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "priority",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "orderType",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "customerId",
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "orderDate",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "deliveryDate",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "priority",
          "status",
          "orderDate"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      }
    ]
  },
  "categories": {
    "fields": [
      "id",
      "name",
      "description",
      "parentId",
      "isActive",
      "sortOrder",
      "color",
      "icon",
      "createdAt",
      "updatedAt",
      "searchTerms"
    ],
    "textFields": [
      "name",
      "description"
    ],
    "searchPatterns": [
      {
        "fields": [
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "sortOrder"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "parentId",
          "isActive",
          "sortOrder"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "parentId",
          "isActive",
          "name"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      }
    ]
  },
  "inventory": {
    "fields": [
      "id",
      "productId",
      "quantity",
      "reservedQuantity",
      "availableQuantity",
      "minStockLevel",
      "maxStockLevel",
      "reorderLevel",
      "lastUpdated",
      "location",
      "batchNumber",
      "expiryDate",
      "costPrice",
      "sellingPrice",
      "userId"
    ],
    "textFields": [
      "batchNumber",
      "location"
    ],
    "searchPatterns": [
      {
        "fields": [
          "productId",
          "lastUpdated"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "quantity",
          "minStockLevel"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "availableQuantity",
          "reorderLevel"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "location",
          "productId"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "expiryDate",
          "productId"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "userId",
          "lastUpdated"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "productId",
          "location",
          "batchNumber"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      }
    ]
  },
  "stockMovements": {
    "fields": [
      "id",
      "productId",
      "movementType",
      "quantity",
      "balanceQuantity",
      "referenceId",
      "referenceType",
      "notes",
      "userId",
      "createdAt",
      "batchNumber",
      "costPrice"
    ],
    "textFields": [
      "notes",
      "batchNumber"
    ],
    "searchPatterns": [
      {
        "fields": [
          "productId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "movementType",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "referenceType",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "productId",
          "movementType",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "referenceId",
          "referenceType"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "productId",
          "referenceType",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      }
    ]
  },
  "transactions": {
    "fields": [
      "id",
      "type",
      "partyId",
      "amount",
      "paymentMethod",
      "referenceNumber",
      "status",
      "description",
      "userId",
      "createdAt",
      "updatedAt"
    ],
    "textFields": [
      "referenceNumber",
      "description"
    ],
    "searchPatterns": [
      {
        "fields": [
          "partyId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "type",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "paymentMethod",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "partyId",
          "type",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "amount",
          "status"
        ],
        "orders": [
          "DESC",
          "ASC"
        ]
      }
    ]
  },
  "reports": {
    "fields": [
      "id",
      "reportType",
      "userId",
      "parameters",
      "generatedAt",
      "status",
      "filePath",
      "expiresAt"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "generatedAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "reportType",
          "generatedAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "status",
          "generatedAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "reportType",
          "generatedAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "expiresAt",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      }
    ]
  },
  "users": {
    "fields": [
      "id",
      "email",
      "displayName",
      "role",
      "isActive",
      "permissions",
      "lastLoginAt",
      "createdAt",
      "updatedAt"
    ],
    "textFields": [
      "email",
      "displayName"
    ],
    "searchPatterns": [
      {
        "fields": [
          "isActive",
          "role"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "role",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "isActive",
          "lastLoginAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "isActive",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      }
    ]
  },
  "notifications": {
    "fields": [
      "id",
      "userId",
      "type",
      "title",
      "message",
      "isRead",
      "priority",
      "createdAt",
      "readAt",
      "expiresAt"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "isRead",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "type",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "priority",
          "isRead",
          "createdAt"
        ],
        "orders": [
          "DESC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "type",
          "isRead"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "expiresAt",
          "isRead"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      }
    ]
  },
  "auditLogs": {
    "fields": [
      "id",
      "userId",
      "action",
      "resource",
      "resourceId",
      "timestamp",
      "ipAddress",
      "userAgent",
      "details"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "timestamp"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "action",
          "timestamp"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "resource",
          "timestamp"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "resourceId",
          "timestamp"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "action",
          "timestamp"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "resource",
          "resourceId",
          "timestamp"
        ],
        "orders": [
          "ASC",
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "resource",
          "action"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      }
    ]
  },
  "settings": {
    "fields": [
      "id",
      "userId",
      "category",
      "key",
      "value",
      "isActive",
      "updatedAt"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "category"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "category",
          "key"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "userId",
          "category",
          "key"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "isActive",
          "category"
        ],
        "orders": [
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "userId",
          "updatedAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      }
    ]
  },
  "backups": {
    "fields": [
      "id",
      "backupType",
      "userId",
      "status",
      "filePath",
      "fileSize",
      "createdAt",
      "completedAt",
      "errorMessage"
    ],
    "searchPatterns": [
      {
        "fields": [
          "userId",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "backupType",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "status",
          "createdAt"
        ],
        "orders": [
          "ASC",
          "DESC"
        ]
      },
      {
        "fields": [
          "userId",
          "backupType",
          "status"
        ],
        "orders": [
          "ASC",
          "ASC",
          "ASC"
        ]
      },
      {
        "fields": [
          "completedAt",
          "status"
        ],
        "orders": [
          "DESC",
          "ASC"
        ]
      }
    ]
  }
};

// Page-specific search patterns  
export const PAGE_SEARCH_PATTERNS = {
  "/dashboard": [
    {
      "collection": "invoices",
      "fields": [
        "userId",
        "status",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "products",
      "fields": [
        "quantity",
        "minStockLevel",
        "isActive"
      ],
      "orders": [
        "ASC",
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "orders",
      "fields": [
        "status",
        "priority",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC",
        "DESC"
      ]
    },
    {
      "collection": "stockMovements",
      "fields": [
        "createdAt",
        "movementType"
      ],
      "orders": [
        "DESC",
        "ASC"
      ]
    }
  ],
  "/products": [
    {
      "collection": "products",
      "fields": [
        "isActive",
        "name"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "products",
      "fields": [
        "categoryId",
        "isActive",
        "name"
      ],
      "orders": [
        "ASC",
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "products",
      "fields": [
        "isActive",
        "quantity",
        "minStockLevel"
      ],
      "orders": [
        "ASC",
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "categories",
      "fields": [
        "isActive",
        "sortOrder"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    }
  ],
  "/parties": [
    {
      "collection": "parties",
      "fields": [
        "isActive",
        "name"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "parties",
      "fields": [
        "customerType",
        "isActive",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "parties",
      "fields": [
        "supplierType",
        "isActive",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    }
  ],
  "/invoices": [
    {
      "collection": "invoices",
      "fields": [
        "userId",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "invoices",
      "fields": [
        "status",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "invoices",
      "fields": [
        "partyId",
        "status",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "invoices",
      "fields": [
        "paymentStatus",
        "dueDate"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    }
  ],
  "/purchases": [
    {
      "collection": "purchases",
      "fields": [
        "userId",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "purchases",
      "fields": [
        "supplierId",
        "status",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "purchases",
      "fields": [
        "receivedStatus",
        "deliveryDate"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    }
  ],
  "/orders": [
    {
      "collection": "orders",
      "fields": [
        "userId",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "orders",
      "fields": [
        "status",
        "priority",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC",
        "DESC"
      ]
    },
    {
      "collection": "orders",
      "fields": [
        "customerId",
        "status",
        "orderDate"
      ],
      "orders": [
        "ASC",
        "ASC",
        "ASC"
      ]
    }
  ],
  "/inventory": [
    {
      "collection": "inventory",
      "fields": [
        "quantity",
        "minStockLevel"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "inventory",
      "fields": [
        "productId",
        "location"
      ],
      "orders": [
        "ASC",
        "ASC"
      ]
    },
    {
      "collection": "stockMovements",
      "fields": [
        "productId",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    }
  ],
  "/reports": [
    {
      "collection": "reports",
      "fields": [
        "userId",
        "reportType",
        "generatedAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "auditLogs",
      "fields": [
        "userId",
        "timestamp"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "transactions",
      "fields": [
        "type",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    }
  ],
  "/stock-management": [
    {
      "collection": "inventory",
      "fields": [
        "productId",
        "lastUpdated"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "stockMovements",
      "fields": [
        "productId",
        "movementType",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "products",
      "fields": [
        "quantity",
        "minStockLevel",
        "maxStockLevel"
      ],
      "orders": [
        "ASC",
        "ASC",
        "ASC"
      ]
    }
  ],
  "/ledger": [
    {
      "collection": "transactions",
      "fields": [
        "partyId",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "transactions",
      "fields": [
        "type",
        "partyId",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "invoices",
      "fields": [
        "partyId",
        "paymentStatus",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "ASC",
        "DESC"
      ]
    }
  ],
  "/accounting": [
    {
      "collection": "transactions",
      "fields": [
        "type",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "transactions",
      "fields": [
        "paymentMethod",
        "createdAt"
      ],
      "orders": [
        "ASC",
        "DESC"
      ]
    },
    {
      "collection": "invoices",
      "fields": [
        "totalAmount",
        "status"
      ],
      "orders": [
        "DESC",
        "ASC"
      ]
    }
  ]
};
