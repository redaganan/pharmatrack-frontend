import React, { useEffect, useRef, useState } from "react";
import "../../styles/OrdersBody.css";

import { checkout as checkoutApi, recentOrders } from "../apis/orderApi";
import { getProducts } from "../apis/productApi";

const cartImg = new URL("../../images/cart.jpg", import.meta.url).href;

type Product = { _id: string; name: string; quantity: number; price: number };
type CartItem = {
  productId: string;
  product: string;
  quantity: number;
  price: number;
  totalAmount: number;
};
type CompletedOrder = {
  items: CartItem[];
  total: number;
  cashTendered: number;
  change: number;
  date: Date;
  orderId: string;
};

const OrdersBody: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderQty, setOrderQty] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<
    {
      orderId: string;
      productId: string;
      product: string;
      quantity: number;
      qty?: number; // mobile app may send qty instead of quantity
      price: number;
      totalAmount: number;
      purchaseDate: string;
    }[]
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [expandedTxns, setExpandedTxns] = useState<Set<string>>(new Set());

  // Resolve missing product name using the local products list as a fallback,
  // and normalise the quantity field (mobile may send qty instead of quantity).
  const normalizeOrder = (o: any) => ({
    ...o,
    product:
      o.product && o.product.trim() !== ""
        ? o.product
        : (products.find((p) => p._id === o.productId)?.name ??
          "Unknown Product"),
    quantity: o.quantity ?? o.qty ?? 0,
  });

  // Helper to fetch recent orders
  const fetchRecentOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await recentOrders(
        "http://localhost:8000/api/orders/recent-orders",
      );
      setOrders(
        Array.isArray(data) ? data.slice(0, 20).map(normalizeOrder) : [],
      );
      setOrdersError(null);
    } catch (error) {
      setOrdersError("Failed to fetch recent orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts(
          "http://localhost:8000/api/products/get-product",
        );
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []); // Only fetch once on mount

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await recentOrders(
          "http://localhost:8000/api/orders/recent-orders",
        );
        setOrders(
          Array.isArray(data) ? data.slice(0, 20).map(normalizeOrder) : [],
        );
      } catch (error) {
        setOrdersError("Failed to fetch recent orders");
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]); // re-run once products are loaded so the name lookup works

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashTendered, setCashTendered] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );

  // Thermal printer state (Web Serial API for direct ESC/POS printing)
  const [printerPort, setPrinterPort] = useState<any>(null);
  const [printerConnected, setPrinterConnected] = useState(false);

  // Connect to thermal printer via Web Serial API (GOOJPRT PT-210)
  const connectThermalPrinter = async () => {
    try {
      // @ts-ignore - Web Serial API
      if (!navigator.serial) {
        alert(
          "Web Serial API not supported. Please use Chrome or Edge browser.",
        );
        return;
      }

      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setPrinterPort(port);
      setPrinterConnected(true);
      setToast("Thermal printer connected!");
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 2500);
    } catch (error) {
      console.error("Failed to connect printer:", error);
      alert(
        "Failed to connect to printer. Make sure it is plugged in via USB.",
      );
    }
  };

  // Print directly to thermal printer using ESC/POS commands
  const printToThermalPrinter = async (order: CompletedOrder) => {
    if (!printerPort || !printerConnected) {
      alert('Printer not connected. Click "Connect Printer" first.');
      return;
    }

    try {
      const writer = printerPort.writable.getWriter();

      // ESC/POS commands for GOOJPRT PT-210
      const ESC = 0x1b;
      const GS = 0x1d;

      // Helper to encode text
      const encode = (text: string) => new TextEncoder().encode(text);

      // Initialize printer
      await writer.write(new Uint8Array([ESC, 0x40])); // Initialize

      // Center align
      await writer.write(new Uint8Array([ESC, 0x61, 0x01]));

      // Bold + Large text for header
      await writer.write(new Uint8Array([ESC, 0x21, 0x30])); // Double height + width
      await writer.write(encode("PHARMATRACK\n"));

      // Normal size
      await writer.write(new Uint8Array([ESC, 0x21, 0x00]));
      await writer.write(encode("Pharmacy POS System\n"));
      await writer.write(
        encode(
          order.date.toLocaleDateString() +
            " " +
            order.date.toLocaleTimeString() +
            "\n",
        ),
      );
      await writer.write(encode("Order: " + order.orderId + "\n"));

      // Separator line
      await writer.write(encode("================================\n"));

      // Left align for items
      await writer.write(new Uint8Array([ESC, 0x61, 0x00]));

      // Print items
      for (const item of order.items) {
        await writer.write(encode(item.product + "\n"));
        await writer.write(
          encode(
            `  ${item.quantity} x P${item.price.toFixed(2)} = P${item.totalAmount.toFixed(2)}\n`,
          ),
        );
      }

      // Separator
      await writer.write(encode("--------------------------------\n"));

      // Totals
      await writer.write(
        encode(`Subtotal:        P${order.total.toFixed(2)}\n`),
      );
      await writer.write(new Uint8Array([ESC, 0x21, 0x10])); // Bold
      await writer.write(
        encode(`TOTAL:           P${order.total.toFixed(2)}\n`),
      );
      await writer.write(new Uint8Array([ESC, 0x21, 0x00])); // Normal
      await writer.write(
        encode(`Cash:            P${order.cashTendered.toFixed(2)}\n`),
      );
      await writer.write(
        encode(`Change:          P${order.change.toFixed(2)}\n`),
      );

      // Separator
      await writer.write(encode("================================\n"));

      // Center align for footer
      await writer.write(new Uint8Array([ESC, 0x61, 0x01]));
      await writer.write(encode("Thank you for your purchase!\n"));
      await writer.write(encode("Powered by PharmaTrack\n\n\n"));

      // Cut paper (if supported)
      await writer.write(new Uint8Array([GS, 0x56, 0x00]));

      writer.releaseLock();

      setToast("Receipt printed successfully!");
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 2500);
    } catch (error) {
      console.error("Printing error:", error);
      alert("Failed to print. Check printer connection and try again.");
    }
  };

  const setQtyFor = (id: string, value: number) => {
    setOrderQty((s) => ({ ...s, [id]: value }));
  };

  const addToCart = (product: Product) => {
    console.log("Adding to cart:", product);
    const quantity = Math.max(1, Math.floor(orderQty[product._id] || 1));
    const inCartQuantity =
      cart.find((c) => c.productId === product._id)?.quantity ?? 0;
    if (quantity + inCartQuantity > product.quantity) {
      alert("Not enough stock to add to cart");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.productId === product._id);
      if (existingIndex !== -1) {
        // Update quantity for existing product
        return prev.map((c, idx) =>
          idx === existingIndex
            ? {
                ...c,
                quantity: c.quantity + quantity,
                totalAmount: +((c.quantity + quantity) * c.price).toFixed(2),
              }
            : c,
        );
      } else {
        // Add new product to cart
        return [
          ...prev,
          {
            productId: product._id,
            product: product.name,
            quantity: quantity,
            price: product.price,
            totalAmount: +(quantity * product.price).toFixed(2),
          },
        ];
      }
    });

    setOrderQty((s) => ({ ...s, [product._id]: 1 }));
    setToast(`${product.name} added to cart`);
    setToastOpen(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastOpen(false);
      toastTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const changeCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const product = products.find((p) => p._id === productId);
          if (!product) return c;
          const newQuantity = c.quantity + delta;
          if (newQuantity <= 0) return null;
          if (newQuantity > product.quantity) {
            alert("Not enough stock");
            return c;
          }
          return {
            ...c,
            quantity: newQuantity,
            totalAmount: +(newQuantity * c.price).toFixed(2),
          };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Directly set cart quantity (used by input field)
  const updateCartQty = (productId: string, value: string) => {
    const parsed = parseInt(value, 10);
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const product = products.find((p) => p._id === productId);
          if (!product) return c;
          if (isNaN(parsed)) {
            // Temporarily allow blank input; treat as 1 internally but don't overwrite until blur
            return c;
          }
          let newQuantity = parsed;
          if (newQuantity < 1) newQuantity = 1;
          if (newQuantity > product.quantity) newQuantity = product.quantity; // clamp
          return {
            ...c,
            quantity: newQuantity,
            totalAmount: +(newQuantity * c.price).toFixed(2),
          };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Opens the payment modal instead of immediately checking out
  const initiateCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    setCashTendered("");
    setShowPaymentModal(true);
  };

  const checkout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const cash = parseFloat(cashTendered);
    if (isNaN(cash) || cash < cartTotal) {
      alert(`Insufficient cash. Total is ₱${cartTotal.toFixed(2)}`);
      return;
    }

    setPaymentProcessing(true);
    const url = "http://localhost:8000/api/orders/create-batch-order";
    // Generate ORD- + 8 random uppercase alphanumeric characters
    const generateOrderId = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++)
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      return "ORD-" + code;
    };
    const batchOrderId = generateOrderId();

    const batchPayload = {
      orderId: batchOrderId,
      purchaseDate: new Date().toISOString(),
      items: cart.map((c) => ({
        productId: c.productId,
        product: c.product,
        quantity: c.quantity,
        price: c.price,
        totalAmount: c.totalAmount,
      })),
    };

    try {
      await checkoutApi(url, batchPayload);
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout failed. Please try again.");
      setPaymentProcessing(false);
      return;
    }

    // Save completed order for receipt
    const order: CompletedOrder = {
      items: [...cart],
      total: cartTotal,
      cashTendered: cash,
      change: cash - cartTotal,
      date: new Date(),
      orderId: batchOrderId,
    };

    // Update products and clear cart
    setProducts((prev) =>
      prev.map((p) => {
        const ci = cart.find((c) => c.productId === p._id);
        return ci
          ? { ...p, quantity: Math.max(0, p.quantity - ci.quantity) }
          : p;
      }),
    );
    setCart([]);
    setCartOpen(false);
    setShowPaymentModal(false);
    setPaymentProcessing(false);

    // Refetch recent orders to update UI
    await fetchRecentOrders();

    // Show receipt
    setCompletedOrder(order);
    setShowReceipt(true);
  };

  // Print receipt via browser print API (works with USB/network receipt printers)
  const printReceipt = (order: CompletedOrder) => {
    const receiptWindow = window.open("", "_blank", "width=320,height=650");
    if (!receiptWindow) {
      alert("Please allow popups to print receipts");
      return;
    }
    const receiptHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt</title>
  <style>
    @media print {
      @page { margin: 0; size: 80mm auto; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; font-size: 12px; color: #000; }
    .header { text-align: center; padding-bottom: 8px; border-bottom: 2px dashed #000; margin-bottom: 8px; }
    .header h2 { font-size: 18px; margin: 4px 0; }
    .header .sub { font-size: 10px; color: #555; }
    .order-id { text-align: center; font-size: 10px; margin-bottom: 6px; }
    .items { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
    .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
    .item-detail { font-size: 10px; margin-left: 8px; color: #444; }
    .totals { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
    .total-row.grand { font-weight: bold; font-size: 14px; margin-top: 4px; }
    .total-row.change { font-size: 14px; font-weight: bold; }
    .footer { text-align: center; font-size: 10px; color: #555; padding-top: 8px; border-top: 2px dashed #000; }
    .footer p { margin: 2px 0; }
    .no-print { text-align: center; margin: 16px 0; }
    .no-print button { padding: 8px 24px; font-size: 14px; cursor: pointer; border: 1px solid #333; background: #333; color: #fff; border-radius: 4px; margin: 0 4px; }
    .no-print button.secondary { background: #fff; color: #333; }
  </style>
</head>
<body>
  <div class="header">
    <h2>PHARMATRACK</h2>
    <div class="sub">Pharmacy POS System</div>
    <div class="sub">${order.date.toLocaleDateString()} ${order.date.toLocaleTimeString()}</div>
  </div>
  <div class="order-id">Order: ${order.orderId}</div>
  <div class="items">
    ${order.items
      .map(
        (item) => `
      <div class="item-row">
        <span>${item.product}</span>
        <span>₱${item.totalAmount.toFixed(2)}</span>
      </div>
      <div class="item-detail">${item.quantity} x ₱${item.price.toFixed(2)}</div>
    `,
      )
      .join("")}
  </div>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>₱${order.total.toFixed(2)}</span></div>
    <div class="total-row grand"><span>TOTAL</span><span>₱${order.total.toFixed(2)}</span></div>
    <div class="total-row"><span>Cash</span><span>₱${order.cashTendered.toFixed(2)}</span></div>
    <div class="total-row change"><span>Change</span><span>₱${order.change.toFixed(2)}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>Powered by PharmaTrack</p>
  </div>
  <div class="no-print">
    <button onclick="window.print()">Print Receipt</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  <script>
    // Auto-print when loaded (prints to default printer - set GOOJPRT PT-210 as default)
    window.onload = function() {
      // Small delay to ensure content is rendered
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.totalAmount, 0);

  // Filtered products based on search term (case-insensitive)
  const filteredProducts = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, searchTerm]);

  // Group orders by orderId into transactions
  const groupedOrders = React.useMemo(() => {
    const map = new Map<string, typeof orders>();
    for (const o of orders) {
      const key = o.orderId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return Array.from(map.entries()).map(([orderId, items]) => ({
      orderId,
      purchaseDate: items[0].purchaseDate,
      items,
      totalQty: items.reduce((s, i) => s + (i.quantity ?? i.qty ?? 0), 0),
      totalAmount: items.reduce((s, i) => s + (i.totalAmount || 0), 0),
    }));
  }, [orders]);

  const toggleTxn = (orderId: string) => {
    setExpandedTxns((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  return (
    <div className="orders-body">
      <div
        className={`toast ${toastOpen ? "open" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
      {/* Toolbar with search */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          margin: "6px 0 8px",
        }}
      >
        <div style={{ fontWeight: 600 }}></div>
        <input
          type="text"
          placeholder="Search products..."
          aria-label="Search products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 4,
            border: "1px solid #ccc",
            minWidth: 240,
          }}
        />

        {/* Thermal Printer Connect Button */}
        <button
          className="printer-connect-btn"
          onClick={connectThermalPrinter}
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            padding: "12px 20px",
            backgroundColor: printerConnected ? "#4caf50" : "#2196F3",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 999,
          }}
        >
          {printerConnected ? "🖨️ Printer Connected" : "🔌 Connect Printer"}
        </button>
      </div>
      <div className="orders-table-container" style={{ overflowX: "auto" }}>
        <table className="orders-table products-catalog-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Available</th>
              <th className="price-col">Price (PHP)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  No matching products
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p._id}>
                  <td className="product-col">{p.name}</td>
                  <td>{p.quantity}</td>
                  <td className="right price-col">
                    <span className="amount">
                      {typeof p.price === "number" && !isNaN(p.price)
                        ? p.price.toFixed(2)
                        : "0.00"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => addToCart(p)}
                      disabled={p.quantity === 0}
                    >
                      Add to Cart
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Recent Orders</h4>
        {ordersLoading ? (
          <p>Loading recent orders...</p>
        ) : ordersError ? (
          <p className="empty">{ordersError}</p>
        ) : groupedOrders.length === 0 ? (
          <p className="empty">No orders yet</p>
        ) : (
          <table className="orders-table recent-orders-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Date & Time</th>
                <th>Order ID</th>
                <th>Details</th>
                <th>Qty</th>
                <th className="right price-col">Total (PHP)</th>
              </tr>
            </thead>
            <tbody>
              {groupedOrders.map((txn) => {
                const expanded = expandedTxns.has(txn.orderId);
                const d = new Date(txn.purchaseDate);
                return (
                  <React.Fragment key={txn.orderId}>
                    <tr
                      className="txn-summary-row"
                      onClick={() => toggleTxn(txn.orderId)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="txn-toggle">{expanded ? "▼" : "▶"}</td>
                      <td className="nowrap">
                        {d.toLocaleDateString()} {d.toLocaleTimeString()}
                      </td>
                      <td className="nowrap">{txn.orderId}</td>
                      <td>
                        {txn.items.length} item
                        {txn.items.length !== 1 ? "s" : ""}
                      </td>
                      <td>{txn.totalQty}</td>
                      <td className="right price-col">
                        <span className="amount">
                          {txn.totalAmount.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                    {expanded &&
                      txn.items.map((item, idx) => (
                        <tr
                          key={`${txn.orderId}-item-${idx}`}
                          className="txn-item-row"
                        >
                          <td></td>
                          <td colSpan={2}></td>
                          <td className="txn-item-name">
                            ↳ {item.product || "Unknown Product"}
                          </td>
                          <td>{item.quantity ?? item.qty ?? 0}</td>
                          <td className="right price-col">
                            <span className="amount">
                              {(item.totalAmount || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <button
        className="cart-toggle"
        onClick={() => setCartOpen(true)}
        aria-label="Open cart"
      >
        🛒 Cart ({cartCount})
      </button>

      {/* Thermal Printer Connect Button */}
      <button
        className="printer-connect-btn"
        onClick={connectThermalPrinter}
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          padding: "12px 20px",
          backgroundColor: printerConnected ? "#4caf50" : "#2196F3",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 999,
        }}
      >
        {printerConnected ? "🖨️ Printer Connected" : "🔌 Connect Printer"}
      </button>

      <aside className={`cart-slider ${cartOpen ? "open" : ""}`}>
        <div className="cart-header">
          <div className="cart-title">
            <img src={cartImg} alt="cart" />
            <div>
              <h3>Your Cart</h3>
              <small>{cartCount} item(s)</small>
            </div>
          </div>
          <div className="cart-actions">
            <button className="btn-link" onClick={() => setCartOpen(false)}>
              Close
            </button>
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">Your cart is empty</div>
          ) : (
            cart.map((c) => (
              <div className="cart-item" key={c.productId}>
                <div className="cart-item-info">
                  <div className="cart-item-name">{c.product}</div>
                  <div className="cart-item-meta">
                    <div className="cart-qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => changeCartQty(c.productId, -1)}
                      >
                        -
                      </button>
                      <input
                        className="cart-qty-input"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Enter quantity"
                        max={
                          products.find((p) => p._id === c.productId)
                            ?.quantity ?? undefined
                        }
                        value={c.quantity}
                        onChange={(e) =>
                          updateCartQty(c.productId, e.target.value)
                        }
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            updateCartQty(c.productId, "1");
                          } else {
                            // ensure clamped after manual edit
                            updateCartQty(c.productId, e.target.value);
                          }
                        }}
                      />
                      <button
                        className="qty-btn"
                        onClick={() => changeCartQty(c.productId, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-price">
                      × <span className="amount">{c.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-item-total">
                    <span className="amount">{c.totalAmount.toFixed(2)}</span>
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => removeFromCart(c.productId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-summary">
            <div>Total</div>
            <div className="cart-total">
              <span className="amount">{cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="cart-buttons">
            <button className="btn-secondary" onClick={clearCart}>
              Clear
            </button>
            <button
              className="btn-primary"
              onClick={initiateCheckout}
              disabled={cart.length === 0}
            >
              Checkout
            </button>
          </div>
        </div>
      </aside>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="payment-modal-title">Payment</h3>
            <div className="payment-summary">
              <div className="payment-row">
                <span>Items</span>
                <span>{cart.reduce((s, c) => s + c.quantity, 0)}</span>
              </div>
              <div className="payment-row payment-total-row">
                <span>Total</span>
                <span>₱{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <label className="payment-label">Cash Tendered</label>
            <input
              className="payment-input"
              type="number"
              min={0}
              step="0.01"
              placeholder={`Min ₱${cartTotal.toFixed(2)}`}
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") checkout();
              }}
            />
            {cashTendered && parseFloat(cashTendered) >= cartTotal && (
              <div className="payment-change">
                <span>Change</span>
                <span className="change-amount">
                  ₱{(parseFloat(cashTendered) - cartTotal).toFixed(2)}
                </span>
              </div>
            )}
            {cashTendered && parseFloat(cashTendered) < cartTotal && (
              <div className="payment-insufficient">Insufficient amount</div>
            )}
            <div className="payment-quick-cash">
              {[20, 50, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  className="quick-cash-btn"
                  onClick={() => setCashTendered(String(amt))}
                >
                  ₱{amt}
                </button>
              ))}
            </div>
            <div className="payment-buttons">
              <button
                className="btn-secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={checkout}
                disabled={
                  paymentProcessing ||
                  !cashTendered ||
                  parseFloat(cashTendered) < cartTotal
                }
              >
                {paymentProcessing ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && completedOrder && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-content">
              <div className="receipt-header">
                <h3>PHARMATRACK</h3>
                <div className="receipt-sub">Pharmacy POS System</div>
                <div className="receipt-date">
                  {completedOrder.date.toLocaleDateString()}{" "}
                  {completedOrder.date.toLocaleTimeString()}
                </div>
                <div className="receipt-order-id">
                  Order: {completedOrder.orderId}
                </div>
              </div>
              <div className="receipt-items">
                {completedOrder.items.map((item, i) => (
                  <div key={i} className="receipt-item">
                    <div className="receipt-item-row">
                      <span>{item.product}</span>
                      <span>₱{item.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="receipt-item-detail">
                      {item.quantity} x ₱{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="receipt-totals">
                <div className="receipt-total-row">
                  <span>Subtotal</span>
                  <span>₱{completedOrder.total.toFixed(2)}</span>
                </div>
                <div className="receipt-total-row grand">
                  <span>TOTAL</span>
                  <span>₱{completedOrder.total.toFixed(2)}</span>
                </div>
                <div className="receipt-total-row">
                  <span>Cash</span>
                  <span>₱{completedOrder.cashTendered.toFixed(2)}</span>
                </div>
                <div className="receipt-total-row change">
                  <span>Change</span>
                  <span>₱{completedOrder.change.toFixed(2)}</span>
                </div>
              </div>
              <div className="receipt-footer">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
            <div className="receipt-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  printerConnected
                    ? printToThermalPrinter(completedOrder)
                    : printReceipt(completedOrder)
                }
                style={{ minWidth: "180px" }}
              >
                {printerConnected ? "🖨️ Print to Thermal" : "🖨️ Print Receipt"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowReceipt(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersBody;
