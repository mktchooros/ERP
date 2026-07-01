// 📄 ใบเสนอราคา — ฟอร์ม PROSOFT + Dropdown ลูกค้า + สินค้า + Barcode
const ScreenQuotation = ({ setCurrent }) => {
  const MENU_LIST = (typeof loadMenuLive === "function") ? loadMenuLive() : (typeof MENU !== "undefined" ? MENU : []);
  const customers = React.useMemo(() => {try {return typeof loadCustomers === "function" ? loadCustomers() : [];} catch (e) {return [];}}, []);

  const today = new Date().toISOString().split("T")[0];
  const [orderDate, setOrderDate] = React.useState(today);
  const [customerId, setCustomerId] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [fax, setFax] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [validDays, setValidDays] = React.useState(7);
  const [custOpen, setCustOpen] = React.useState(false);
  const [poNumber, setPoNumber] = React.useState("");
  const [poDate, setPoDate] = React.useState(today);
  const [onHold, setOnHold] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [creditDays, setCreditDays] = React.useState(7);
  const [discount, setDiscount] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(7);
  const [vatType, setVatType] = React.useState("exclusive"); // exclusive = VAT นอก, inclusive = VAT ใน
  const [notes, setNotes] = React.useState("");
  const [barcodeScan, setBarcodeScan] = React.useState("");
  const [items, setItems] = React.useState([{ id: 0, code: "", qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: 0 }]);
  const [nid, setNid] = React.useState(1);
  const [msg, setMsg] = React.useState("");
  const [view, setView] = React.useState("edit");

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

  const addRow = () => {setItems([...items, { id: nid, code: "", qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: 0 }]);setNid(nid + 1);};
  const rmRow = (id) => setItems(items.filter((i) => i.id !== id));
  const setItem = (id, patch) => setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));

  const pickProduct = (id, code) => {
    const p = MENU_LIST.find((m) => m.code === code);
    setItem(id, { code, price: p ? p.price : 0, unit: (p && p.unit) || "ซอง" });
  };

  const pickCustomer = (c) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerAddress(c.address || "");
    setCustomerPhone(c.phone || c.tel || "");
    setContactName(c.contact || c.contactName || "");
    setFax(c.fax || "");
    setCustOpen(false);
  };

  const handleBarcodeInput = (e) => {
    if (e.key === "Enter") {
      const product = MENU_LIST.find((m) => m.barcode === barcodeScan || m.code === barcodeScan);
      if (product) {
        const lastItem = items[items.length - 1];
        if (lastItem.code) addRow();
        const targetId = lastItem.code ? nid : lastItem.id;
        pickProduct(targetId, product.code);
        setBarcodeScan("");
        setMsg(`✅ เพิ่ม ${product.name}`);
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
    return { ...i, name: p.name || "", unit: i.unit || p.unit || "ซอง", lineTotal: qty * price };
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
  // คำนวณ Expire Date = วันที่เอกสาร + ยืนราคาภายใน (วัน)
  const expireDate = React.useMemo(() => {
    if (!orderDate) return "";
    const dt = new Date(orderDate);
    dt.setDate(dt.getDate() + (parseInt(validDays) || 0));
    return dt.toISOString().split("T")[0];
  }, [orderDate, validDays]);

  const reset = () => {
    setOrderDate(today);setCustomerId("");setCustomerName("");setCustomerAddress("");setCustomerPhone("");setContactName("");setFax("");setDeliveryDate("");setValidDays(7);setPoNumber("");setPoDate(today);
    setOnHold(false);setPaymentMethod("cash");setCreditDays(7);
    setDiscount(0);setTaxRate(7);setVatType("exclusive");setNotes("");setBarcodeScan("");setItems([{ id: 0, code: "", qty: 1, qtyPerOrder: 1, targetOrder: "", otherPart: "", price: 0 }]);setNid(1);
  };

  const save = () => {
    if (!customerName.trim()) {setMsg("⚠️ กรุณาเลือก/กรอกชื่อลูกค้า");setTimeout(() => setMsg(""), 2500);return;}
    if (lines.length === 0) {setMsg("⚠️ กรุณาเพิ่มรายการสินค้า");setTimeout(() => setMsg(""), 2500);return;}
    const ds = orderDate.replace(/-/g, "").slice(2, 6);
    let n = 1;
    for (let i = 0; i < localStorage.length; i++) {const k = localStorage.key(i);if (k && k.startsWith(`quotation_QT${ds}`)) n++;}
    const quoteNumber = `QT${ds}${String(n).padStart(4, "0")}`;
    const order = {
      quoteNumber, orderDate, customerId, customerName: customerName.trim(),
      customerAddress, customerPhone, contactName, fax, deliveryDate, validDays: parseInt(validDays) || 0, expireDate,
      poNumber, poDate, onHold,
      paymentMethod, creditDays: paymentMethod === "credit" ? creditDays : null,
      items: lines.map((l) => ({ code: l.code, name: l.name, qty: parseFloat(l.qty) || 0, unit: l.unit || "ซอง", price: parseFloat(l.price) || 0, total: l.lineTotal })),
      subtotal, discount: parseFloat(discount) || 0, discountAmount: discAmt,
      vatType, taxRate: parseFloat(taxRate) || 0, taxAmount: taxAmt,
      totalAmount: grandTotal, paymentStatus: "unpaid", notes,
      savedAt: new Date().toLocaleString("th-TH")
    };
    try {
      localStorage.setItem(`quotation_${quoteNumber}`, JSON.stringify(order));
      window.dataCache?.invalidate?.("quotation_list");
      setMsg(`✅ บันทึกใบเสนอราคา ${quoteNumber} แล้ว`);
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
    const orderNum = `QT${orderDate.replace(/-/g, "").slice(2, 6)}0001`;
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
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700 }}>ใบเสนอราคา / Quotation</div>
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

          {/* Customer info box — รูปแบบใบเสนอราคา */}
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, marginBottom: 10, ...bd }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 6px", width: 90, verticalAlign: "top" }}>ชื่อผู้ติดต่อ</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{contactName || "—"}</td>
                <td style={{ padding: "3px 6px", width: 110, verticalAlign: "top", borderLeft: "1px solid #000" }}>วันที่กำหนดส่ง</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }} colSpan={3}>{fmtDate(deliveryDate) || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ชื่อบริษัท</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", fontWeight: 600 }}>{customerName || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>ยืนราคาภายใน</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{validDays} วัน</td>
                <td style={{ padding: "3px 6px", width: 90, verticalAlign: "top", fontWeight: 600 }}>Expire Date</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{fmtDate(expireDate) || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>โทร.</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{customerPhone || cust.phone || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>จำนวนวันเครดิต</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{paymentMethod === "credit" ? `${creditDays} วัน` : "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>VAT</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{vatType === "inclusive" ? "ใน" : "นอก"} {taxRate}%</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>โทรสาร</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{fax || "—"}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>การชำระ</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{{ cash: "เงินสด", transfer: "เงินโอน", credit: "เครดิต", cod: "เก็บปลายทาง" }[paymentMethod]}</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ที่อยู่</td>
                <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{customerAddress || cust.address || "—"}</td>
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
                  <td style={{ ...bd, padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}></td>
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
            {["ผู้เสนอราคา", "ผู้มีอำนาจลงนาม", "ผู้รับใบเสนอราคา"].map((role) =>
              <div key={role} style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px dotted #000", height: 50, marginBottom: 4 }}></div>
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
          <h1 className="page-title">📄 ใบเสนอราคา</h1>
          <p className="page-sub">บันทึกใบเสนอราคาใหม่ · Dropdown ลูกค้า + สินค้า · สแกน Barcode</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setView("preview")}>👁️ ดูตัวอย่าง</button>
        </div>
      </div>

      {msg && <div className="alert" style={{ background: msg.startsWith("✅") ? "var(--leaf-soft)" : "var(--warn-soft)", border: "1px solid #D8C49E", color: "var(--ink-2)", marginBottom: 14 }}>{msg}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 14 }}>
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
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ชื่อผู้ติดต่อ</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="ชื่อผู้ติดต่อ" style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ที่อยู่ลูกค้า</label>
              <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="ที่อยู่สำหรับออกใบกำกับ/จัดส่ง" style={inp} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เบอร์โทรลูกค้า</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08x-xxx-xxxx" style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>โทรสาร</label>
              <input value={fax} onChange={(e) => setFax(e.target.value)} placeholder="แฟกซ์ (ถ้ามี)" style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่กำหนดส่ง</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ยืนราคาภายใน (วัน)</label>
              <div style={{ position: "relative" }}>
                <input type="number" min="0" value={validDays} onChange={(e) => setValidDays(e.target.value)} style={{ ...inp, paddingRight: 70 }} />
                <span style={{ position: "absolute", right: 8, top: 9, fontSize: 11, color: "var(--muted)" }}>หมด {fmtDate(expireDate)}</span>
              </div>
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
              <th className="num" style={{ width: 130 }}>รวม</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const lt = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
              return (
                <tr key={it.id}>
                  <td className="num">{idx + 1}</td>
                  <td style={{ position: "relative" }}>
                    <input type="text" value={it.code} onChange={(e) => setItem(it.id, { code: e.target.value })} placeholder="-- เลือก --" style={{ ...inp, fontSize: 11 }} />
                  </td>
                  <td style={{ position: "relative" }}>
                    <select value={it.code} onChange={(e) => pickProduct(it.id, e.target.value)} style={{ ...inp, fontSize: 11 }}>
                      <option value="">-- เลือกสินค้า --</option>
                      {MENU_LIST.map((m) =>
                      <option key={m.code} value={m.code}>{m.name}</option>
                      )}
                    </select>
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

Object.assign(window, { ScreenQuotation });