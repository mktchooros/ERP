// 📝 ใบสั่งขาย — ฟอร์ม PROSOFT + Dropdown ลูกค้า + สินค้า + Barcode
const ScreenSalesOrder = ({ setCurrent }) => {
  const MENU_LIST = (typeof loadMenuLive === "function") ? loadMenuLive() : (typeof MENU !== "undefined" ? MENU : []);
  const customers = React.useMemo(() => {try {return typeof loadCustomers === "function" ? loadCustomers() : [];} catch (e) {return [];}}, []);

  const today = new Date().toISOString().split("T")[0];
  const [orderDate, setOrderDate] = React.useState(today);
  const [customerId, setCustomerId] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [salesPerson, setSalesPerson] = React.useState("");
  const [shippingMethod, setShippingMethod] = React.useState(""); // '', 'cell', 'jnt', 'thailand-post'
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [shippingStatus, setShippingStatus] = React.useState("order"); // order, producing, packing, shipping, delivered
  const [custOpen, setCustOpen] = React.useState(false);
  const [poNumber, setPoNumber] = React.useState("");
  const [poDate, setPoDate] = React.useState(today);
  const [onHold, setOnHold] = React.useState(false);
  const [docType, setDocType] = React.useState("tax-invoice"); // ประเภทเอกสาร: tax-invoice, cash-bill, temp-delivery, loan
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [creditDays, setCreditDays] = React.useState(7);
  const [discount, setDiscount] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(7);
  const [vatType, setVatType] = React.useState("exclusive"); // exclusive = VAT นอก, inclusive = VAT ใน
  const [notes, setNotes] = React.useState("");
  const [barcodeScan, setBarcodeScan] = React.useState("");
  const [seqNumber, setSeqNumber] = React.useState(""); // เลขลำดับเอกสาร (เว้นว่าง = อัตโนมัติ)
  const [items, setItems] = React.useState([{ id: 0, code: "", qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: 0, disc: 0 }]);
  const [nid, setNid] = React.useState(1);
  const [msg, setMsg] = React.useState("");
  const [view, setView] = React.useState("edit");
  const [prodSearch, setProdSearch] = React.useState({});
  const [prodOpen, setProdOpen] = React.useState({});

  const custMatches = React.useMemo(() => {
    if (!custOpen) return [];
    const q = customerName.trim().toLowerCase();
    if (!q) return customers.slice(0, 10);
    return customers.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.id || "").toLowerCase().includes(q)).slice(0, 10);
  }, [customerName, custOpen, customers]);

  const productMatches = (searchTerm) => {
    if (!searchTerm) return [];
    const q = searchTerm.trim().toLowerCase();
    return MENU_LIST.filter((m) => (m.code || "").toLowerCase().includes(q) || (m.name || "").toLowerCase().includes(q)).slice(0, 8);
  };

  const addRow = () => {setItems([...items, { id: nid, code: "", qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: 0, disc: 0 }]);setNid(nid + 1);};
  const rmRow = (id) => setItems(items.filter((i) => i.id !== id));
  const setItem = (id, patch) => setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));

  const pickProduct = (id, code) => {
    const p = MENU_LIST.find((m) => m.code === code);
    setItem(id, { code, price: p ? p.price : 0, unit: (p && p.unit) || "ซอง" });
    setProdSearch(prev => { const n = {...prev}; delete n[id]; return n; });
    setProdOpen(prev => ({ ...prev, [id]: false }));
  };

  const pickCustomer = (c) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerAddress(c.address || "");
    setCustomerPhone(c.phone || c.tel || "");
    setCustOpen(false);
  };

  const handleBarcodeInput = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeScan.trim();
      if (!code) return;
      const product = MENU_LIST.find((m) => m.barcode === code || m.code === code);
      if (product) {
        const existing = items.find((i) => i.code === product.code);
        if (existing) {
          // สแกนซ้ำ → เพิ่มจำนวน +1
          setItem(existing.id, { qty: (parseFloat(existing.qty) || 0) + 1 });
          setMsg(`✅ ${product.name} +1 (รวม ${(parseFloat(existing.qty) || 0) + 1})`);
        } else {
          const lastItem = items[items.length - 1];
          if (lastItem && lastItem.code) {
            setItems([...items, { id: nid, code: product.code, qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: product.price || 0, disc: 0, unit: product.unit || "ซอง" }]);
            setNid(nid + 1);
          } else {
            pickProduct(lastItem.id, product.code);
          }
          setMsg(`✅ เพิ่ม ${product.name}`);
        }
        setBarcodeScan("");
        setTimeout(() => setMsg(""), 2000);
      } else {
        setMsg("⚠️ ไม่พบสินค้า");
        setTimeout(() => setMsg(""), 2000);
      }
    }
  };

  const lines = items.filter((i) => i.code).map((i) => {
    const p = MENU_LIST.find((m) => m.code === i.code) || {};
    const qty = parseFloat(i.qty) || 0,price = parseFloat(i.price) || 0;
    const disc = parseFloat(i.disc) || 0;
    const gross = qty * price;
    const lineDiscAmt = Math.min(Math.max(disc, 0), gross);
    return { ...i, name: p.name || "", unit: i.unit || p.unit || "ซอง", disc, lineDiscAmt, lineTotal: gross - lineDiscAmt };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discAmt = subtotal * ((parseFloat(discount) || 0) / 100);
  const subtotalAfterDisc = subtotal - discAmt;
  const rate = (parseFloat(taxRate) || 0) / 100;
  // VAT นอก: ภาษีบวกเพิ่มจากยอด | VAT ใน: ภาษีรวมอยู่ในยอดแล้ว
  const taxAmt = vatType === "inclusive"
    ? subtotalAfterDisc * rate / (1 + rate)
    : subtotalAfterDisc * rate;
  const grandTotal = vatType === "inclusive"
    ? subtotalAfterDisc
    : subtotalAfterDisc + taxAmt;
  const preVatBase = vatType === "inclusive" ? subtotalAfterDisc - taxAmt : subtotalAfterDisc;
  const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // คำนวณวันครบกำหนดชำระ = วันกำหนดส่ง + จำนวนวันเครดิต (ถ้าไม่มีวันกำหนดส่ง ใช้วันที่ออกบิล)
  const computeDueDate = (od, days) => { if (!od) return ""; const d = new Date(od); d.setDate(d.getDate() + (parseInt(days) || 0)); return d.toISOString().split("T")[0]; };
  const dueDate = paymentMethod === "credit" ? computeDueDate(deliveryDate || orderDate, creditDays) : "";

  const reset = () => {
    setOrderDate(today);setCustomerId("");setCustomerName("");setCustomerAddress("");setCustomerPhone("");setDeliveryDate("");setSalesPerson("");setShippingMethod("");setTrackingNumber("");setShippingStatus("order");setPoNumber("");setPoDate(today);
    setOnHold(false);setPaymentMethod("cash");setCreditDays(7);setSeqNumber("");setDocType("tax-invoice");
    setDiscount(0);setTaxRate(7);setVatType("exclusive");setNotes("");setBarcodeScan("");setItems([{ id: 0, code: "", qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: 0, disc: 0 }]);setNid(1);
  };

  const save = () => {
    if (!customerName.trim()) {setMsg("⚠️ กรุณาเลือก/กรอกชื่อลูกค้า");setTimeout(() => setMsg(""), 2500);return;}
    if (lines.length === 0) {setMsg("⚠️ กรุณาเพิ่มรายการสินค้า");setTimeout(() => setMsg(""), 2500);return;}
    const ds = orderDate.replace(/-/g, "").slice(2, 6);
    let orderNumber;
    const manualSeq = String(seqNumber).trim();
    if (manualSeq !== "") {
      // ผู้ใช้กรอกเลขลำดับเอง — คงรูปแบบ SO{YYMM} ไว้ ต่อด้วยเลขที่กรอก (เติม 0 ให้ครบ 4 หลัก)
      const digits = manualSeq.replace(/\D/g, "");
      if (!digits) {setMsg("⚠️ เลขที่ใบสั่งขายต้องเป็นตัวเลข");setTimeout(() => setMsg(""), 2500);return;}
      orderNumber = `SO${ds}${digits.padStart(4, "0")}`;
      if (localStorage.getItem(`sales_order_${orderNumber}`)) {
        setMsg(`⚠️ เลขที่ ${orderNumber} มีอยู่แล้ว — กรุณาเปลี่ยนเลขใหม่`);
        setTimeout(() => setMsg(""), 3500);
        return;
      }
    } else {
      // อัตโนมัติ: หาเลขลำดับสูงสุดของรูปแบบ SO{YYMM}NNNN แล้ว +1 พร้อมกันเลขซ้ำ
      const seqRe = new RegExp(`^sales_order_SO${ds}(\\d{4})$`);
      let maxSeq = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const m = k && k.match(seqRe);
        if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
      }
      let n = maxSeq + 1;
      orderNumber = `SO${ds}${String(n).padStart(4, "0")}`;
      while (localStorage.getItem(`sales_order_${orderNumber}`)) {
        n++;
        orderNumber = `SO${ds}${String(n).padStart(4, "0")}`;
      }
    }
    const order = {
      orderNumber, orderDate, customerId, customerName: customerName.trim(),
      customerAddress, customerPhone, deliveryDate, salesPerson: salesPerson.trim(), shippingMethod, trackingNumber, shippingStatus,
      poNumber, poDate, onHold, docType,
      paymentMethod, creditDays: paymentMethod === "credit" ? creditDays : null,
      dueDate: paymentMethod === "credit" ? computeDueDate(deliveryDate || orderDate, creditDays) : null,
      items: lines.map((l) => ({ code: l.code, name: l.name, qty: parseFloat(l.qty) || 0, unit: l.unit || "ซอง", price: parseFloat(l.price) || 0, disc: parseFloat(l.disc) || 0, discountAmount: l.lineDiscAmt || 0, total: l.lineTotal })),
      subtotal, discount: parseFloat(discount) || 0, discountAmount: discAmt,
      vatType, taxRate: parseFloat(taxRate) || 0, taxAmount: taxAmt,
      totalAmount: grandTotal, paymentStatus: "unpaid", notes,
      savedAt: new Date().toLocaleString("th-TH")
    };
    try {
      localStorage.setItem(`sales_order_${orderNumber}`, JSON.stringify(order));
      window.dataCache?.invalidate?.("sales_list");
      setMsg(`✅ บันทึกใบสั่งขาย ${orderNumber} แล้ว`);
      reset();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {setMsg("❌ บันทึกไม่สำเร็จ: " + e.message);}
  };

  const inp = { padding: "8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, width: "100%" };

  // แปลงตัวเลขเป็นข้อความภาษาไทย (บาท/สตางค์)
  const bahtText = (num) => {
    num = parseFloat(num) || 0;
    const txtNum = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const txtPos = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    const readBlock = (n) => {
      let s = "";const digits = String(n).split("");
      const len = digits.length;
      for (let i = 0; i < len; i++) {
        const d = parseInt(digits[i]);const pos = len - i - 1;
        if (d === 0) continue;
        if (pos === 0 && d === 1 && len > 1) s += "เอ็ด";else
        if (pos === 1 && d === 2) s += "ยี่" + txtPos[pos];else
        if (pos === 1 && d === 1) s += txtPos[pos];else
        s += txtNum[d] + txtPos[pos];
      }
      return s;
    };
    const readNumber = (n) => {
      if (n === 0) return "ศูนย์";
      let result = "";const s = String(n);
      if (s.length > 6) {
        const millions = Math.floor(n / 1000000);
        const rest = n % 1000000;
        result = readNumber(millions) + "ล้าน";
        if (rest > 0) result += readBlock(rest);
        return result;
      }
      return readBlock(n);
    };
    const baht = Math.floor(num);
    const satang = Math.round((num - baht) * 100);
    let txt = readNumber(baht) + "บาท";
    if (satang > 0) txt += readBlock(satang) + "สตางค์";else
    txt += "ถ้วน";
    return txt;
  };

  if (view === "preview") {
    const orderNum = `SO${orderDate.replace(/-/g, "").slice(2, 6)}0001`;
    const cust = customers.find((c) => c.id === customerId) || {};
    const bd = { border: "1px solid #000" };
    const minRows = Math.max(0, 8 - lines.length);
    return (
      <div style={{ background: "#e8e8e8", padding: 20, minHeight: "100vh" }}>
        {/* Toolbar */}
        <div className="no-print" style={{ maxWidth: 820, margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn" onClick={() => setView("edit")}>← ย้อนกลับ</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์ / บันทึก PDF</button>
          </div>
        </div>

        {/* A4 Page */}
        <div id="so-print-area" style={{ width: 820, minHeight: 1100, margin: "0 auto", background: "white", padding: "32px 36px", fontSize: 12, fontFamily: "'Sarabun', 'TH Sarabun New', Arial, sans-serif", color: "#000", boxShadow: "0 4px 20px rgba(0,0,0,.2)", position: "relative", overflow: "hidden" }}>
          {/* Watermark */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
            <img src="logo-yaipu.png" alt="" style={{ width: 460, opacity: 0.06 }} />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "right", fontSize: 11, marginBottom: 4 }}>หน้า 1 / 1</div>

          {/* Company header */}
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
              <img src="logo-yaipu.png" alt="ชูรสยายปู" style={{ width: 84, height: 84, objectFit: "contain" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>บริษัท ชูรสยายปู จำกัด</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160</div>
              <div style={{ fontSize: 12 }}>เลขประจำตัวผู้เสียภาษี 0495567000363</div>
            </div>
          </div>

          {/* Title + number box */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, alignItems: "center", marginBottom: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{{ "tax-invoice": "ใบกำกับภาษี / Tax Invoice", "cash-bill": "บิลเงินสด / Cash Bill", "temp-delivery": "ใบส่งสินค้าชั่วคราว", "loan": "ใบยืมสินค้า" }[docType] || "Sale Order / ใบสั่งขาย"}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>ใบสั่งขาย / Sale Order</div>
            </div>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
              <tbody>
                <tr>
                  <td style={{ ...bd, padding: "4px 8px", background: "#f0f0f0", width: 70 }}>เลขที่</td>
                  <td style={{ ...bd, padding: "4px 8px" }}>{orderNum}</td>
                </tr>
                <tr>
                  <td style={{ ...bd, padding: "4px 8px", background: "#f0f0f0" }}>วันที่</td>
                  <td style={{ ...bd, padding: "4px 8px" }}>{fmtDate(orderDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer info box */}
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, marginBottom: 10, ...bd }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 6px", width: 70, verticalAlign: "top" }}>รหัสลูกค้า</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{customerId || "—"}</td>
                <td style={{ padding: "3px 6px", width: 90, verticalAlign: "top", borderLeft: "1px solid #000" }}>ใบสั่งจอง</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{poNumber || "—"}</td>
                <td style={{ padding: "3px 6px", width: 70, verticalAlign: "top" }}>ลงวันที่</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{fmtDate(poDate)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ชื่อลูกค้า</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", fontWeight: 600 }}>{customerName || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>การชำระ</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{{ cash: "เงินสด", transfer: "เงินโอน", credit: "เครดิต", cod: "เก็บปลายทาง" }[paymentMethod]}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>เงื่อนไข</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{paymentMethod === "credit" ? `เครดิต ${creditDays} วัน${dueDate ? " · ครบกำหนด " + fmtDate(dueDate) : ""}` : "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ที่อยู่</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{customerAddress || cust.address || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>แผนก</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ฝ่ายขาย</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>VAT</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{vatType === "inclusive" ? "ใน" : "นอก"} {taxRate}%</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>โทร.</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{customerPhone || cust.phone || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>วิธีขนส่ง</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{{ "": "—", "cell": "เซลล์หน่วยรถ", "jnt": "J&T", "flash": "Flash", "thailand-post": "ไปรษณีย์ไทย" }[shippingMethod]}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>Tracking</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{trackingNumber || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>พนักงานขาย</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", fontWeight: 600 }}>{salesPerson || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>สถานะส่ง</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }} colSpan={3}>{{ "order": "รับออร์เดอร์", "producing": "กำลังผลิต", "packing": "กำลังแพ็ค", "shipping": "กำลังส่ง", "delivered": "ส่งสำเร็จ" }[shippingStatus]}</td>
              </tr>
            </tbody>
          </table>

          {/* Items table */}
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, marginBottom: 0 }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ ...bd, padding: "5px 6px", width: 80 }}>รหัสสินค้า</th>
                <th style={{ ...bd, padding: "5px 6px" }}>รายการ</th>
                <th style={{ ...bd, padding: "5px 6px", width: 70 }}>จำนวน</th>
                <th style={{ ...bd, padding: "5px 6px", width: 55 }}>หน่วย</th>
                <th style={{ ...bd, padding: "5px 6px", width: 80 }}>ราคา/หน่วย</th>
                <th style={{ ...bd, padding: "5px 6px", width: 60 }}>ส่วนลด</th>
                <th style={{ ...bd, padding: "5px 6px", width: 90 }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) =>
                <tr key={l.id}>
                  <td style={{ ...bd, padding: "4px 6px", verticalAlign: "top" }}>{l.code}</td>
                  <td style={{ ...bd, padding: "4px 6px", verticalAlign: "top" }}>{l.name}</td>
                  <td style={{ ...bd, padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>{fmt(l.qty)}</td>
                  <td style={{ ...bd, padding: "4px 6px", textAlign: "center", verticalAlign: "top" }}>{l.unit || "—"}</td>
                  <td style={{ ...bd, padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>{fmt(l.price)}</td>
                  <td style={{ ...bd, padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>{l.disc ? fmt(l.disc) : ""}</td>
                  <td style={{ ...bd, padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>{fmt(l.lineTotal)}</td>
                </tr>
                )}
              {Array.from({ length: minRows }).map((_, i) =>
                <tr key={`e${i}`} style={{ height: 26 }}>
                  <td style={bd}></td><td style={bd}></td><td style={bd}></td><td style={bd}></td><td style={bd}></td><td style={bd}></td><td style={bd}></td>
                </tr>
                )}
            </tbody>
          </table>

          {/* Notes + Summary */}
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, marginTop: -1 }}>
            <tbody>
              <tr>
                <td rowSpan={5} style={{ ...bd, padding: "6px", verticalAlign: "top", width: "55%" }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>หมายเหตุ</div>
                  <div>{notes || ""}</div>
                </td>
                <td style={{ ...bd, padding: "4px 8px", width: 130 }}>รวมเงิน</td>
                <td style={{ ...bd, padding: "4px 8px", textAlign: "right" }}>{fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style={{ ...bd, padding: "4px 8px" }}>ส่วนลดการค้า {discount}%</td>
                <td style={{ ...bd, padding: "4px 8px", textAlign: "right" }}>{fmt(discAmt)}</td>
              </tr>
              <tr>
                <td style={{ ...bd, padding: "4px 8px" }}>เงินหลังหักส่วนลด</td>
                <td style={{ ...bd, padding: "4px 8px", textAlign: "right" }}>{fmt(subtotalAfterDisc)}</td>
              </tr>
              {vatType === "inclusive" &&
              <tr>
                <td style={{ ...bd, padding: "4px 8px" }}>มูลค่าก่อน VAT</td>
                <td style={{ ...bd, padding: "4px 8px", textAlign: "right" }}>{fmt(preVatBase)}</td>
              </tr>
              }
              <tr>
                <td style={{ ...bd, padding: "4px 8px" }}>ภาษีมูลค่าเพิ่ม {taxRate}% ({vatType === "inclusive" ? "VAT ใน" : "VAT นอก"})</td>
                <td style={{ ...bd, padding: "4px 8px", textAlign: "right" }}>{fmt(taxAmt)}</td>
              </tr>
              <tr>
                <td style={{ ...bd, padding: "4px 8px", fontWeight: 700, background: "#f0f0f0" }}>จำนวนเงินทั้งสิ้น</td>
                <td style={{ ...bd, padding: "4px 8px", textAlign: "right", fontWeight: 700, background: "#f0f0f0" }}>{fmt(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ ...bd, borderTop: "none", padding: "5px 8px", textAlign: "center", fontSize: 12 }}>
            ( {bahtText(grandTotal)} )
          </div>

          {/* Signatures */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30, marginTop: 50, marginBottom: 10 }}>
            {["พนักงานขาย", "ผู้จัดการฝ่ายขาย", "พนักงานบัญชี"].map((role) =>
              <div key={role} style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px dotted #000", height: 50, marginBottom: 4, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2, fontSize: 12 }}>{role === "พนักงานขาย" ? salesPerson : ""}</div>
                <div style={{ fontSize: 11 }}>{role}</div>
                <div style={{ fontSize: 11, marginTop: 6 }}>วันที่ ______/______/______</div>
              </div>
              )}
          </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📝 ใบสั่งขาย</h1>
          <p className="page-sub">บันทึกใบสั่งขายใหม่ · Dropdown ลูกค้า + สินค้า · สแกน Barcode</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setView("preview")}>👁️ ดูตัวอย่าง</button>
        </div>
      </div>

      {msg && <div className="alert" style={{ background: msg.startsWith("✅") ? "var(--leaf-soft)" : "var(--warn-soft)", border: "1px solid #D8C49E", color: "var(--ink-2)", marginBottom: 14 }}>{msg}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 14 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เลขที่ใบสั่งขาย <span style={{ opacity: .7 }}>(เว้นว่าง = อัตโนมัติ)</span></label>
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "var(--leaf-soft, #eef3e6)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "6px 0 0 6px", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", whiteSpace: "nowrap" }}>SO{orderDate.replace(/-/g, "").slice(2, 6)}</span>
                <input value={seqNumber} onChange={(e) => setSeqNumber(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="อัตโนมัติ" style={{ ...inp, borderRadius: "0 6px 6px 0" }} />
              </div>
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่</label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} style={inp} />
            </div>
            <div style={{ position: "relative", gridColumn: "span 2" }}>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ลูกค้า</label>
              <input value={customerName} placeholder="พิมพ์หรือเลือกลูกค้า…" onChange={(e) => setCustomerName(e.target.value)} onFocus={() => setCustOpen(true)} onBlur={() => setTimeout(() => setCustOpen(false), 180)} style={{ ...inp, paddingRight: 28 }} />
              <div style={{ position: "absolute", right: 8, top: "35px", fontSize: 18, cursor: "pointer" }}>▼</div>
              {custOpen &&
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "white", border: "1px solid var(--border)", borderRadius: 6, marginTop: 2, maxHeight: 280, overflowY: "auto", boxShadow: "0 6px 18px rgba(34,26,20,.16)" }}>
                  {custMatches.length === 0 ? <div style={{ padding: "10px", color: "var(--muted)" }}>ไม่พบลูกค้า</div> :
                custMatches.map((c) =>
                <div key={c.id} onMouseDown={() => pickCustomer(c)} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontWeight: 600 }}>{c.id}</span> · {c.name}
                    </div>
                )}
                </div>
              }
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ใบส่ง PO</label>
              <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="เลขที่ PO" style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่ PO</label>
              <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} style={inp} />
            </div>
          </div>

          {/* ที่อยู่ + เบอร์โทรลูกค้า */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ที่อยู่ลูกค้า</label>
              <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="ที่อยู่สำหรับออกใบกำกับ/จัดส่ง" style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เบอร์โทรลูกค้า</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08x-xxx-xxxx" style={inp} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันกำหนดส่ง</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>พนักงานขาย</label>
              <input value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} placeholder="ชื่อพนักงานขาย" style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="small muted" style={{ display: "block", marginBottom: 6 }}>ประเภทเอกสารที่ออก</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { v: "tax-invoice", t: "ออกใบกำกับภาษี" },
                { v: "cash-bill", t: "ออกบิลเงินสด" },
                { v: "temp-delivery", t: "ออกใบส่งสินค้าชั่วคราว" },
                { v: "loan", t: "ออกใบยืม" },
              ].map((o) =>
                <label key={o.v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "8px 14px", borderRadius: 6, border: `1px solid ${docType === o.v ? "var(--leaf, #6f8f3f)" : "var(--border)"}`, background: docType === o.v ? "var(--leaf-soft, #eef3e6)" : "#fff", fontWeight: docType === o.v ? 600 : 400, fontSize: 13 }}>
                  <input type="radio" name="docType" value={o.v} checked={docType === o.v} onChange={(e) => setDocType(e.target.value)} />
                  {o.t}
                </label>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วิธีขนส่ง</label>
              <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} style={inp}>
                <option value="">—</option>
                <option value="cell">เซลล์หน่วยรถ</option>
                <option value="jnt">J&T</option>
                <option value="flash">Flash</option>
                <option value="thailand-post">ไปรษณีย์ไทย</option>
              </select>
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>Tracking Number</label>
              <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="เลขที่ติดตาม" style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>สถานะการส่ง</label>
              <select value={shippingStatus} onChange={(e) => setShippingStatus(e.target.value)} style={inp}>
                <option value="order">รับออร์เดอร์</option>
                <option value="producing">กำลังผลิต</option>
                <option value="packing">กำลังแพ็ค</option>
                <option value="shipping">กำลังส่ง</option>
                <option value="delivered">ส่งสำเร็จ</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>การชำระเงิน</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inp}>
                <option value="cash">เงินสด</option>
                <option value="transfer">เงินโอน</option>
                <option value="credit">เครดิต</option>
                <option value="cod">เก็บปลายทาง</option>
              </select>
            </div>
            {paymentMethod === "credit" &&
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>จำนวนวันเครดิต</label>
              <div style={{ position: "relative" }}>
                <input type="number" min="0" value={creditDays} onChange={(e) => setCreditDays(e.target.value)} style={{ ...inp, paddingRight: 34 }} />
                <span style={{ position: "absolute", right: 10, top: 9, fontSize: 12, color: "var(--muted)" }}>วัน</span>
              </div>
            </div>
            }
            {paymentMethod === "credit" &&
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันครบกำหนดชำระ</label>
              <input type="date" value={dueDate} readOnly tabIndex={-1} style={{ ...inp, background: "var(--leaf-soft, #eef3e6)", cursor: "default" }} />
            </div>
            }
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ส่วนลด (%)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>VAT (%)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ประเภท VAT</label>
              <select value={vatType} onChange={(e) => setVatType(e.target.value)} style={inp}>
                <option value="exclusive">VAT นอก (เพิ่มจากยอด)</option>
                <option value="inclusive">VAT ใน (รวมในยอด)</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, gridColumn: paymentMethod === "credit" ? "span 6" : "span 1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flex: 1 }}>
                <input type="checkbox" checked={onHold} onChange={(e) => setOnHold(e.target.checked)} /> <span style={{ fontSize: 12 }}>On Hold</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body">
          <label className="small muted" style={{ display: "block", marginBottom: 4 }}>🔎 สแกน Barcode (กด Enter)</label>
          <input value={barcodeScan} onChange={(e) => setBarcodeScan(e.target.value)} onKeyPress={handleBarcodeInput} placeholder="สแกน barcode หรือเลขที่สินค้า…" autoFocus style={{ ...inp, fontSize: 14 }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, overflowX: "auto" }}>
        <table className="tbl" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th style={{ minWidth: 120 }}>รหัส</th>
              <th style={{ minWidth: 220 }}>ชื่อสินค้า</th>
              <th className="num" style={{ width: 90 }}>จำนวน</th>
              <th style={{ width: 100 }}>หน่วย</th>
              <th className="num" style={{ width: 120 }}>ราคา/หน่วย</th>
              <th className="num" style={{ width: 100 }}>ส่วนลด (บาท)</th>
              <th className="num" style={{ width: 130 }}>รวม</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const gross = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
              const lt = Math.max(0, gross - (parseFloat(it.disc) || 0));
              return (
                <tr key={it.id}>
                  <td className="num">{idx + 1}</td>
                  <td style={{ position: "relative" }}>
                    <input type="text" value={it.code} onChange={(e) => setItem(it.id, { code: e.target.value })} placeholder="-- เลือก --" style={{ ...inp, fontSize: 11 }} />
                  </td>
                  <td style={{ position: "relative" }}>
                    {(() => {
                      const p = MENU_LIST.find(m => m.code === it.code);
                      const searchVal = prodSearch[it.id] !== undefined ? prodSearch[it.id] : (p ? p.name : "");
                      const matches = prodSearch[it.id] !== undefined
                        ? productMatches(prodSearch[it.id])
                        : (prodOpen[it.id] ? MENU_LIST.slice(0, 10) : []);
                      return (<>
                        <input
                          value={searchVal}
                          placeholder="-- ค้นหาชื่อ / รหัสสินค้า --"
                          onChange={e => { setProdSearch(prev => ({ ...prev, [it.id]: e.target.value })); setProdOpen(prev => ({ ...prev, [it.id]: true })); }}
                          onFocus={() => setProdOpen(prev => ({ ...prev, [it.id]: true }))}
                          onBlur={() => setTimeout(() => setProdOpen(prev => ({ ...prev, [it.id]: false })), 180)}
                          style={{ ...inp, fontSize: 11 }}
                        />
                        {prodOpen[it.id] && matches.length > 0 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, maxHeight: 220, overflowY: "auto" }}>
                            {matches.map(m => (
                              <div key={m.code} onMouseDown={() => pickProduct(it.id, m.code)}
                                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                                onMouseLeave={e => e.currentTarget.style.background = ""}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", width: 40, flexShrink: 0 }}>{m.code}</span>
                                <span style={{ flex: 1 }}>{m.name}</span>
                                <span style={{ fontSize: 10, color: "var(--muted)" }}>฿{(m.price||0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>);
                    })()}
                  </td>
                  <td><input type="number" value={it.qty} onChange={(e) => setItem(it.id, { qty: e.target.value })} style={{ ...inp, textAlign: "right", fontSize: 11 }} /></td>
                  <td>
                    <select value={it.unit || "ซอง"} onChange={(e) => setItem(it.id, { unit: e.target.value })} style={{ ...inp, fontSize: 11 }}>
                      <option value="ซอง">ซอง</option>
                      <option value="กล่อง">กล่อง</option>
                      <option value="แพ็ค">แพ็ค</option>
                      <option value="ขวด">ขวด</option>
                      <option value="ถุง">ถุง</option>
                      <option value="กิโลกรัม">กิโลกรัม</option>
                      <option value="ชิ้น">ชิ้น</option>
                      <option value="ลัง">ลัง</option>
                    </select>
                  </td>
                  <td><input type="number" value={it.price} onChange={(e) => setItem(it.id, { price: e.target.value })} style={{ ...inp, textAlign: "right", fontSize: 11 }} /></td>
                  <td><input type="number" min="0" value={it.disc} onChange={(e) => setItem(it.id, { disc: e.target.value })} placeholder="0" style={{ ...inp, textAlign: "right", fontSize: 11 }} /></td>
                  <td className="num tnum" style={{ fontWeight: 600, fontSize: 11 }}>฿{fmt(lt)}</td>
                  <td><button className="btn btn-sm" onClick={() => rmRow(it.id)} style={{ color: "var(--brand)" }}>✕</button></td>
                </tr>);

            })}
          </tbody>
        </table>
        <div style={{ padding: 12 }}>
          <button className="btn" style={{ width: "100%", borderStyle: "dashed" }} onClick={addRow}>+ เพิ่มรายการ</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>
        <div className="card">
          <div className="card-body">
            <label className="small muted" style={{ display: "block", marginBottom: 4 }}>หมายเหตุ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="บันทึกเพิ่มเติม…" style={{ ...inp, resize: "vertical" }} />
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span className="muted">ยอดรวม</span><span className="tnum">฿{fmt(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span className="muted">ส่วนลด ({discount}%)</span><span className="tnum">−฿{fmt(discAmt)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span className="muted">ภาษี ({taxRate}% · {vatType === "inclusive" ? "VAT ใน" : "VAT นอก"})</span><span className="tnum">฿{fmt(taxAmt)}</span></div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700 }}>รวมสุทธิ</span><span className="tnum" style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>฿{fmt(grandTotal)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn" style={{ flex: 1 }} onClick={reset}>ล้าง</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

Object.assign(window, { ScreenSalesOrder });