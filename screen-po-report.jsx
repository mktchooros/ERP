// 📋 ใบสั่งซื้อ (PO) — ฟอร์ม PROSOFT style + Dropdown ผู้ขาย + สินค้า
const ScreenPOForm = ({ setCurrent }) => {
  const RAW_LIST = (typeof loadRawLive === "function") ? loadRawLive() : (typeof RAW !== "undefined" ? RAW : []);
  const [suppliers, setSuppliers] = React.useState([]);
  const [scanQ, setScanQ] = React.useState("");
  const [scanOpen, setScanOpen] = React.useState(false);
  const scanRef = React.useRef(null);
  
  const today = new Date().toISOString().split("T")[0];
  const [poDate, setPoDate] = React.useState(today);
  const [supplierId, setSupplierId] = React.useState("");
  const [supplierName, setSupplierName] = React.useState("");
  const [supplierAddress, setSupplierAddress] = React.useState("");
  const [supplierPhone, setSupplierPhone] = React.useState("");
  const [supplierTax, setSupplierTax] = React.useState("");
  const [supplierOpen, setSupplierOpen] = React.useState(false);
  const [poNumber, setPoNumber] = React.useState("");
  const [prNumber, setPrNumber] = React.useState("");
  const [requiredDate, setRequiredDate] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [creditDays, setCreditDays] = React.useState(30);
  const [dueDate, setDueDate] = React.useState("");
  const [requester, setRequester] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [quotationRef, setQuotationRef] = React.useState("");
  const [incoterm, setIncoterm] = React.useState("");
  const [deliveryPlace, setDeliveryPlace] = React.useState("");
  const [currency, setCurrency] = React.useState("THB");
  const [fxRate, setFxRate] = React.useState(1);
  const [warranty, setWarranty] = React.useState("");
  const [latePenalty, setLatePenalty] = React.useState("");
  const [approvalStatus, setApprovalStatus] = React.useState("draft");
  const [discount, setDiscount] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(7);
  const [vatType, setVatType] = React.useState("exclusive");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState([{ id: 0, code: "", qty: 1, unit: "", cost: 0 }]);
  const [nid, setNid] = React.useState(1);
  const [msg, setMsg] = React.useState("");
  const [view, setView] = React.useState("edit");
  const [openProductSearch, setOpenProductSearch] = React.useState(null); // item id ที่กำลังค้นหา

  // Load suppliers from SUPPLIERS key (same as screen-supplier.jsx)
  React.useEffect(() => {
    const list = typeof loadSuppliers === "function" ? loadSuppliers() : [];
    setSuppliers(list.filter(s => s.status !== "inactive"));
  }, []);

  const supplierMatches = React.useMemo(() => {
    if (!supplierOpen) return [];
    const q = supplierName.trim().toLowerCase();
    if (!q) return suppliers.slice(0, 10);
    return suppliers.filter((s) => (s.name || "").toLowerCase().includes(q) || (s.id || "").toLowerCase().includes(q)).slice(0, 10);
  }, [supplierName, supplierOpen, suppliers]);

  const productMatches = (searchTerm) => {
    if (!searchTerm) return [];
    const q = searchTerm.trim().toLowerCase();
    return RAW_LIST.filter((m) =>
      (m.code || "").toLowerCase().includes(q) ||
      (m.name || "").toLowerCase().includes(q) ||
      (m.barcode ? String(m.barcode).includes(q) : false)
    ).slice(0, 8);
  };

  // หาวัตถุดิบจากบาร์โค้ดแบบตรงตัว → รหัสตรงตัว → ตัวแรกที่ตรงคำค้น
  const findRaw = (term) => {
    const t = (term || "").trim();
    if (!t) return null;
    const tl = t.toLowerCase();
    return RAW_LIST.find((m) => m.barcode && String(m.barcode) === t)
      || RAW_LIST.find((m) => (m.code || "").toLowerCase() === tl)
      || productMatches(t)[0]
      || null;
  };

  // เพิ่มจากสแกน/ค้นหา — ถ้ามีอยู่แล้วเพิ่มจำนวน มิฉะนั้นเพิ่มแถวใหม่
  const addByScan = (term) => {
    const r = findRaw(term);
    if (!r) {
      setMsg("⚠️ ไม่พบวัตถุดิบ: " + term);
      setTimeout(() => setMsg(""), 2000);
      return;
    }
    const cost = r.buyPrice || r.cost || 0;
    const unit = r.buyUnit || r.unit || "";
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.code === r.code);
      if (idx >= 0) {
        return prev.map((i, k) => k === idx ? { ...i, qty: (parseFloat(i.qty) || 0) + 1 } : i);
      }
      const blank = prev.findIndex((i) => !i.code);
      if (blank >= 0) {
        return prev.map((i, k) => k === blank ? { ...i, code: r.code, qty: 1, unit, cost } : i);
      }
      return [...prev, { id: nid, code: r.code, qty: 1, unit, cost }];
    });
    setNid((n) => n + 1);
    setScanQ("");
    setScanOpen(false);
    if (scanRef.current) scanRef.current.focus();
  };

  const addRow = () => {
    setItems([...items, { id: nid, code: "", qty: 1, unit: "", cost: 0 }]);
    setNid(nid + 1);
  };
  
  const rmRow = (id) => setItems(items.filter((i) => i.id !== id));
  
  const setItem = (id, patch) => setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));

  const pickProduct = (id, code) => {
    const p = RAW_LIST.find((m) => m.code === code);
    setItem(id, { code, cost: p ? (p.buyPrice || p.cost || 0) : 0, unit: (p && (p.buyUnit || p.unit)) || "" });
  };

  const pickSupplier = (s) => {
    setSupplierId(s.id);
    setSupplierName(s.name);
    setSupplierAddress(s.address || "");
    setSupplierPhone(s.phone || "");
    setSupplierTax(s.tax || "");
    setSupplierOpen(false);
  };

  const lines = items.filter((i) => i.code).map((i) => {
    const p = RAW_LIST.find((m) => m.code === i.code) || {};
    const qty = parseFloat(i.qty) || 0;
    const cost = parseFloat(i.cost) || 0;
    return { ...i, name: p.name || "", unit: i.unit || p.buyUnit || p.unit || "", lineTotal: qty * cost };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discAmt = subtotal * ((parseFloat(discount) || 0) / 100);
  const subtotalAfterDisc = subtotal - discAmt;
  const rate = (parseFloat(taxRate) || 0) / 100;
  const taxAmt = vatType === "inclusive"
    ? subtotalAfterDisc * rate / (1 + rate)
    : subtotalAfterDisc * rate;
  const grandTotal = vatType === "inclusive"
    ? subtotalAfterDisc
    : subtotalAfterDisc + taxAmt;

  const PAY_METHODS = [
    { value: "cash", label: "\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e14" },
    { value: "transfer", label: "\u0e42\u0e2d\u0e19\u0e08\u0e48\u0e32\u0e22" },
    { value: "credit", label: "\u0e40\u0e04\u0e23\u0e14\u0e34\u0e15" },
    { value: "cheque", label: "\u0e41\u0e04\u0e0a\u0e40\u0e0a\u0e35\u0e22\u0e23\u0e4c\u0e40\u0e0a\u0e47\u0e04" },
  ];
  const payLabel = (v) => (PAY_METHODS.find((m) => m.value === v) || {}).label || "\u2014";
  const INCOTERMS = ["EXW", "FCA", "FOB", "CIF", "CPT", "DAP", "DDP"];
  const CURRENCIES = ["THB", "USD", "EUR", "CNY", "JPY"];
  const APPROVAL_STEPS = [
    { value: "draft", label: "\u0e23\u0e48\u0e32\u0e07" },
    { value: "pending", label: "\u0e23\u0e2d\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34" },
    { value: "approved", label: "\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e41\u0e25\u0e49\u0e27" },
    { value: "sent", label: "\u0e2a\u0e48\u0e07\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22" },
    { value: "partial", label: "\u0e23\u0e31\u0e1a\u0e02\u0e2d\u0e07\u0e1a\u0e32\u0e07\u0e2a\u0e48\u0e27\u0e19" },
    { value: "received", label: "\u0e23\u0e31\u0e1a\u0e02\u0e2d\u0e07\u0e04\u0e23\u0e1a" },
  ];
  const approvalLabel = (v) => (APPROVAL_STEPS.find((s) => s.value === v) || {}).label || "\u2014";
  const addDaysIso = (iso, days) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return "";
    d.setDate(d.getDate() + (parseInt(days, 10) || 0));
    return d.toISOString().split("T")[0];
  };

  // เครดิต: คำนวณกำหนดชำระจากวันรับของ + จำนวนวันเครดิต (ถ้าไม่ได้ตั้งเอง)
  const effectiveDueDate = paymentMethod === "credit"
    ? (dueDate || addDaysIso(requiredDate || poDate, creditDays))
    : dueDate;

  const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => window.fmtDateGlobal(d);

  const reset = () => {
    setPoDate(today);
    setSupplierId("");
    setSupplierName("");
    setSupplierAddress("");
    setSupplierPhone("");
    setSupplierTax("");
    setPoNumber("");
    setPrNumber("");
    setRequiredDate("");
    setPaymentMethod("cash");
    setCreditDays(30);
    setDueDate("");
    setRequester("");
    setDepartment("");
    setQuotationRef("");
    setIncoterm("");
    setDeliveryPlace("");
    setCurrency("THB");
    setFxRate(1);
    setWarranty("");
    setLatePenalty("");
    setApprovalStatus("draft");
    setDiscount(0);
    setTaxRate(7);
    setVatType("exclusive");
    setNotes("");
    setItems([{ id: 0, code: "", qty: 1, unit: "", cost: 0 }]);
    setNid(1);
  };

  const save = () => {
    if (!supplierName.trim()) {
      setMsg("⚠️ กรุณาเลือก/กรอกชื่อผู้ขาย");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    if (lines.length === 0) {
      setMsg("⚠️ กรุณาเพิ่มรายการวัตถุดิบ");
      setTimeout(() => setMsg(""), 2500);
      return;
    }

    const ds = poDate.replace(/-/g, "").slice(2, 6);
    const maxSeq = Array.from({ length: localStorage.length }, (_, i) => {
      const k = localStorage.key(i);
      const match = k && k.match(new RegExp(`^po_PO${ds}(\\d{4})$`));
      return match ? parseInt(match[1], 10) : 0;
    }).reduce((a, b) => Math.max(a, b), 0);
    const poNum = `PO${ds}${String(maxSeq + 1).padStart(4, "0")}`;

    const po = {
      poNumber: poNum,
      poDate,
      supplierId,
      supplierName: supplierName.trim(),
      supplierAddress,
      supplierPhone,
      supplierTax,
      prNumber,
      requiredDate,
      paymentMethod,
      paymentMethodLabel: payLabel(paymentMethod),
      creditDays: paymentMethod === "credit" ? (parseInt(creditDays, 10) || 0) : 0,
      dueDate: effectiveDueDate,
      requester,
      department,
      quotationRef,
      incoterm,
      deliveryPlace,
      currency,
      fxRate: parseFloat(fxRate) || 1,
      warranty,
      latePenalty,
      approvalStatus,
      approvalStatusLabel: approvalLabel(approvalStatus),
      items: lines.map((l) => ({ code: l.code, name: l.name, qty: parseFloat(l.qty) || 0, unit: l.unit || "ซอง", cost: parseFloat(l.cost) || 0, total: l.lineTotal })),
      subtotal,
      discount: parseFloat(discount) || 0,
      discountAmount: discAmt,
      vatType,
      taxRate: parseFloat(taxRate) || 0,
      taxAmount: taxAmt,
      totalAmount: grandTotal,
      status: approvalLabel(approvalStatus),
      notes,
      savedAt: new Date().toLocaleString("th-TH")
    };

    try {
      localStorage.setItem(`po_${poNum}`, JSON.stringify(po));
      setMsg(`✅ บันทึกใบสั่งซื้อ ${poNum} แล้ว`);
      reset();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg("❌ บันทึกไม่สำเร็จ: " + e.message);
    }
  };

  const inp = { padding: "8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, width: "100%" };

  if (view === "preview") {
    const bd = { border: "1px solid #000" };
    const minRows = Math.max(0, 8 - lines.length);
    return (
      <div style={{ background: "#e8e8e8", padding: 20, minHeight: "100vh" }}>
        <div className="no-print" style={{ maxWidth: 820, margin: "0 auto 16px", display: "flex", justifyContent: "space-between" }}>
          <button className="btn" onClick={() => setView("edit")}>← ย้อนกลับ</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์ / บันทึก PDF</button>
        </div>

        <div id="po-print-area" style={{ width: 820, minHeight: 1100, margin: "0 auto", background: "white", padding: "32px 36px", fontSize: 12, fontFamily: "'Sarabun', 'TH Sarabun New', Arial, sans-serif", color: "#000", boxShadow: "0 4px 20px rgba(0,0,0,.2)", position: "relative", overflow: "hidden" }}>
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
                <div style={{ fontSize: 18, fontWeight: 700 }}>ใบสั่งซื้อ / Purchase Order</div>
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ ...bd, padding: "4px 8px", background: "#f0f0f0", width: 70 }}>เลขที่</td>
                    <td style={{ ...bd, padding: "4px 8px" }}>{poNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ ...bd, padding: "4px 8px", background: "#f0f0f0" }}>วันที่</td>
                    <td style={{ ...bd, padding: "4px 8px" }}>{fmtDate(poDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...bd, padding: "4px 8px", background: "#f0f0f0" }}>อ้าง PR</td>
                    <td style={{ ...bd, padding: "4px 8px" }}>{prNumber || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Supplier info box */}
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, marginBottom: 10, ...bd }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 6px", width: 70, verticalAlign: "top" }}>รหัสผู้ขาย</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{supplierId || "—"}</td>
                  <td style={{ padding: "3px 6px", width: 90, verticalAlign: "top", borderLeft: "1px solid #000" }}>เลขประจำตัว</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{supplierTax || "—"}</td>
                  <td style={{ padding: "3px 6px", width: 70, verticalAlign: "top" }}>รับของถึง</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{fmtDate(requiredDate)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ชื่อผู้ขาย</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top", fontWeight: 600 }}>{supplierName || "—"}</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>เงื่อนไขการชำระ</td>
                  <td colSpan="3" style={{ padding: "3px 6px", verticalAlign: "top" }}>{payLabel(paymentMethod)}{paymentMethod === "credit" ? ` ${parseInt(creditDays, 10) || 0} วัน` : ""}{effectiveDueDate ? ` · ครบกำหนด ${fmtDate(effectiveDueDate)}` : ""}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ที่อยู่</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{supplierAddress || "—"}</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>หมายเหตุ</td>
                  <td colSpan="3" style={{ padding: "3px 6px", verticalAlign: "top" }}>{notes || "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>โทร.</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{supplierPhone || "—"}</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>VAT</td>
                  <td colSpan="3" style={{ padding: "3px 6px", verticalAlign: "top" }}>{vatType === "inclusive" ? "ใน" : "นอก"} {taxRate}%</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ผู้ขอซื้อ</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{requester || "—"}{department ? ` / ${department}` : ""}</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>ใบเสนอราคา</td>
                  <td colSpan="3" style={{ padding: "3px 6px", verticalAlign: "top" }}>{quotationRef || "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>ส่งมอบ</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{incoterm || "—"}{deliveryPlace ? ` · ${deliveryPlace}` : ""}</td>
                  <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>สกุลเงิน</td>
                  <td colSpan="3" style={{ padding: "3px 6px", verticalAlign: "top" }}>{currency}{currency !== "THB" ? ` @ ${fxRate} บาท` : ""}</td>
                </tr>
                {(warranty || latePenalty) && (
                  <tr>
                    <td style={{ padding: "3px 6px", verticalAlign: "top" }}>รับประกัน</td>
                    <td style={{ padding: "3px 6px", verticalAlign: "top" }}>{warranty || "—"}</td>
                    <td style={{ padding: "3px 6px", verticalAlign: "top", borderLeft: "1px solid #000" }}>ค่าปรับล่าช้า</td>
                    <td colSpan="3" style={{ padding: "3px 6px", verticalAlign: "top" }}>{latePenalty || "—"}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Items table */}
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11, marginBottom: 10 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ ...bd, padding: "4px 6px", textAlign: "left" }}>รหัสวัตถุดิบ</th>
                  <th style={{ ...bd, padding: "4px 6px", textAlign: "left" }}>รายการ</th>
                  <th style={{ ...bd, padding: "4px 6px", textAlign: "right", width: 60 }}>จำนวน</th>
                  <th style={{ ...bd, padding: "4px 6px", textAlign: "center", width: 50 }}>หน่วย</th>
                  <th style={{ ...bd, padding: "4px 6px", textAlign: "right", width: 80 }}>ราคาต่อหน่วย</th>
                  <th style={{ ...bd, padding: "4px 6px", textAlign: "right", width: 80 }}>จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td style={{ ...bd, padding: "4px 6px" }}>{l.code}</td>
                    <td style={{ ...bd, padding: "4px 6px" }}>{l.name}</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>{fmt(l.qty)}</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "center" }}>{l.unit}</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>{fmt(l.cost)}</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>{fmt(l.lineTotal)}</td>
                  </tr>
                ))}
                {Array.from({ length: minRows }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ ...bd, padding: "4px 6px" }}>&nbsp;</td>
                    <td style={{ ...bd, padding: "4px 6px" }}>&nbsp;</td>
                    <td style={{ ...bd, padding: "4px 6px" }}>&nbsp;</td>
                    <td style={{ ...bd, padding: "4px 6px" }}>&nbsp;</td>
                    <td style={{ ...bd, padding: "4px 6px" }}>&nbsp;</td>
                    <td style={{ ...bd, padding: "4px 6px" }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12 }}>
              <div>&nbsp;</div>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 6px", textAlign: "right" }}>รวมเงิน</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>{fmt(subtotal)}</td>
                  </tr>
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: "4px 6px", textAlign: "right" }}>ส่วนลด ({discount}%)</td>
                      <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>({fmt(discAmt)})</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "4px 6px", textAlign: "right" }}>ภาษีมูลค่าเพิ่ม ({taxRate}%)</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>{fmt(taxAmt)}</td>
                  </tr>
                  <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>รวมทั้งสิ้น</td>
                    <td style={{ ...bd, padding: "4px 6px", textAlign: "right" }}>{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, textAlign: "center", fontSize: 11 }}>
              <div>
                <div style={{ marginBottom: 40 }}>________________</div>
                <div>ผู้จัดเตรียม</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>วันที่ ___________</div>
              </div>
              <div>
                <div style={{ marginBottom: 40 }}>________________</div>
                <div>ผู้อนุมัติ</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>วันที่ ___________</div>
              </div>
              <div>
                <div style={{ marginBottom: 40 }}>________________</div>
                <div>ผู้บัญชี</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>วันที่ ___________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">ใบสั่งซื้อ</h1>
          <p className="page-sub">สั่งซื้อสินค้าจากผู้ขาย</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={reset}>✕ ยกเลิก</button>
          <button className="btn btn-primary" onClick={() => { save(); setTimeout(() => setView("preview"), 100); }}>✓ บันทึกและดู</button>
        </div>
      </div>

      {msg && (
        <div style={{ margin: "0 0 16px", padding: "10px 12px", background: msg.startsWith("❌") ? "#FBE8E5" : "#E2EDDC", border: `1px solid ${msg.startsWith("❌") ? "#E9B6B1" : "#B8D4B1"}`, borderRadius: 8, color: msg.startsWith("❌") ? "#7A1411" : "#2D5128", fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>เลขที่ PO</label>
          <input style={{ ...inp, marginTop: 4 }} placeholder="อัตโนมัติ" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>วันที่</label>
          <input type="date" style={{ ...inp, marginTop: 4 }} value={poDate} onChange={(e) => setPoDate(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">ผู้ขาย</div>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ชื่อผู้ขาย</label>
            <input
              style={{ ...inp }}
              placeholder="พิมพ์เพื่อค้นหา..."
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              onFocus={() => setSupplierOpen(true)}
            />
            {supplierOpen && supplierMatches.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 6, marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
                {supplierMatches.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSupplier(s)}
                    style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <strong>{s.name}</strong><br /><span style={{ fontSize: 11, color: "var(--muted)" }}>{s.id} — {s.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>เลขประจำตัวผู้เสียภาษี</label>
            <input style={{ ...inp }} placeholder="—" value={supplierTax} onChange={(e) => setSupplierTax(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ที่อยู่</label>
            <input style={{ ...inp }} placeholder="—" value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>โทร</label>
            <input style={{ ...inp }} placeholder="—" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">เงื่อนไขการรับของและการชำระเงิน</div>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>เลขที่ใบขอซื้อ (PR)</label>
            <input style={{ ...inp }} placeholder="เช่น PR250001" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>กำหนดวันรับของ</label>
            <input type="date" style={{ ...inp }} value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ประเภทการชำระ</label>
            <select style={{ ...inp }} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAY_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {paymentMethod === "credit" ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>จำนวนวันเครดิต</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {[7, 15, 30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCreditDays(d)}
                    style={{
                      padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                      border: `1px solid ${(parseInt(creditDays, 10) === d) ? "var(--brand)" : "var(--border)"}`,
                      background: (parseInt(creditDays, 10) === d) ? "var(--brand)" : "white",
                      color: (parseInt(creditDays, 10) === d) ? "white" : "var(--ink)", fontWeight: 600
                    }}
                  >{d} วัน</button>
                ))}
                <input
                  type="number" min="0" step="1" value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  style={{ ...inp, width: 90 }} placeholder="อื่นๆ"
                />
              </div>
            </div>
          ) : <div></div>}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>
              กำหนดชำระ{paymentMethod === "credit" && !dueDate ? " (คำนวณอัตโนมัติ)" : ""}
            </label>
            <input
              type="date" style={{ ...inp }}
              value={effectiveDueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {paymentMethod === "credit" && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                = วันรับของ + {parseInt(creditDays, 10) || 0} วัน · แก้ไขได้
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">ข้อมูลเพิ่มเติม (มาตรฐานสากล)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>สถานะ</span>
            <select style={{ ...inp, width: "auto", padding: "4px 8px" }} value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
              {APPROVAL_STEPS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ผู้ขอซื้อ</label>
            <input style={{ ...inp }} placeholder="ชื่อผู้ขอซื้อ" value={requester} onChange={(e) => setRequester(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ฝ่าย / แผนก</label>
            <input style={{ ...inp }} placeholder="เช่น ฝ่ายผลิต" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>เลขที่ใบเสนอราคา</label>
            <input style={{ ...inp }} placeholder="Quotation ref" value={quotationRef} onChange={(e) => setQuotationRef(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>เงื่อนไขการส่งมอบ (Incoterms)</label>
            <select style={{ ...inp }} value={incoterm} onChange={(e) => setIncoterm(e.target.value)}>
              <option value="">— ไม่ระบุ —</option>
              {INCOTERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>สถานที่ส่งมอบ</label>
            <input style={{ ...inp }} placeholder="จุดส่งของปลายทาง" value={deliveryPlace} onChange={(e) => setDeliveryPlace(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>สกุลเงิน</label>
            <select style={{ ...inp }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {currency !== "THB" ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>อัตราแลกเปลี่ยน (บาท)</label>
              <input type="number" min="0" step="0.0001" style={{ ...inp }} value={fxRate} onChange={(e) => setFxRate(e.target.value)} />
            </div>
          ) : <div></div>}
          <div></div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>เงื่อนไขรับประกัน</label>
            <input style={{ ...inp }} placeholder="เช่น 1 ปี" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ค่าปรับส่งล่าช้า</label>
            <input style={{ ...inp }} placeholder="เช่น 0.1% ต่อวัน ของมูลค่าที่ส่งล่าช้า" value={latePenalty} onChange={(e) => setLatePenalty(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">รายการวัตถุดิบ</div>
          <button className="btn btn-sm" onClick={addRow}>+ เพิ่มแถวว่าง</button>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📷</span>
            <input
              ref={scanRef}
              type="text"
              value={scanQ}
              placeholder="สแกนบาร์โค้ด หรือพิมพ์รหัส/ชื่อวัตถุดิบ แล้วกด Enter เพื่อเพิ่มรายการ"
              onChange={(e) => { setScanQ(e.target.value); setScanOpen(true); }}
              onFocus={() => setScanOpen(true)}
              onBlur={() => setTimeout(() => setScanOpen(false), 200)}
              onKeyDown={(e) => { if (e.key === "Enter" && scanQ.trim()) { e.preventDefault(); addByScan(scanQ); } }}
              style={{ ...inp, flex: 1 }}
            />
          </div>
          {scanOpen && scanQ.trim() && productMatches(scanQ).length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 46, right: 16, background: "white", border: "1px solid var(--border)", borderRadius: 6, marginTop: 2, zIndex: 20, maxHeight: 220, overflowY: "auto", boxShadow: "0 6px 18px rgba(0,0,0,.12)" }}>
              {productMatches(scanQ).map((m) => (
                <button
                  key={m.code}
                  onClick={() => addByScan(m.code)}
                  style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", background: "transparent", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2, #FBF7EE)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <strong style={{ color: "var(--brand)" }}>{m.code}</strong> — {m.name}
                  {m.barcode ? <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: 6 }}> {m.barcode}</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <table className="tbl" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 110 }}>รหัส/บาร์โค้ด</th>
              <th>วัตถุดิบ</th>
              <th style={{ width: 70 }}>จำนวน</th>
              <th style={{ width: 70 }}>หน่วย</th>
              <th style={{ width: 100, textAlign: "right" }}>ราคา/หน่วย</th>
              <th style={{ width: 100, textAlign: "right" }}>รวม</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const p = RAW_LIST.find((m) => m.code === item.code) || {};
              const qty = parseFloat(item.qty) || 0;
              const cost = parseFloat(item.cost) || 0;
              const total = qty * cost;
              const matches = productMatches(item.code);
              const isOpen = openProductSearch === item.id;
              
              return (
                <tr key={item.id}>
                  <td style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="รหัส / ชื่อ / บาร์โค้ดวัตถุดิบ"
                      value={item.code}
                      onChange={(e) => setItem(item.id, { code: e.target.value })}
                      onFocus={() => setOpenProductSearch(item.id)}
                      onBlur={() => setTimeout(() => setOpenProductSearch(null), 200)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && matches.length > 0) {
                          pickProduct(item.id, matches[0].code);
                          setOpenProductSearch(null);
                        }
                      }}
                      style={{ ...inp, fontSize: 12 }}
                    />
                    {isOpen && matches.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 4, marginTop: 2, zIndex: 10, maxHeight: 150, overflowY: "auto", boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
                        {matches.map((m) => (
                          <button
                            key={m.code}
                            onClick={() => { pickProduct(item.id, m.code); setOpenProductSearch(null); }}
                            style={{ display: "block", width: "100%", padding: "6px 10px", textAlign: "left", background: "transparent", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 12, color: "var(--ink)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <strong>{m.code}</strong> — {m.name}{m.barcode ? <span style={{ color: "var(--muted)", fontSize: 11 }}> · {m.barcode}</span> : null}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{p.name || "—"}</td>
                  <td><input type="number" min="0" step="1" value={item.qty} onChange={(e) => setItem(item.id, { qty: e.target.value })} style={{ ...inp, fontSize: 12, textAlign: "center" }} /></td>
                  <td><input type="text" value={item.unit} onChange={(e) => setItem(item.id, { unit: e.target.value })} style={{ ...inp, fontSize: 12, textAlign: "center" }} placeholder="หน่วย" /></td>
                  <td><input type="number" min="0" step="0.01" value={item.cost} onChange={(e) => setItem(item.id, { cost: e.target.value })} style={{ ...inp, fontSize: 12, textAlign: "right" }} /></td>
                  <td style={{ textAlign: "right", paddingRight: 14 }}>{fmt(total)}</td>
                  <td style={{ textAlign: "center" }}><button className="btn btn-sm btn-ghost" onClick={() => rmRow(item.id)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>หมายเหตุ</label>
          <textarea style={{ ...inp, minHeight: 80 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เงื่อนไขพิเศษ โปรแกรมส่วนลด ฯลฯ" />
        </div>
        <div>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>รวมเงิน</label>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand)" }}>{fmt(subtotal)}</div>
            </div>
            {discount > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>ส่วนลด ({discount}%)</label>
                <div style={{ fontSize: 13 }}>−{fmt(discAmt)}</div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>ภาษี ({taxRate}%)</label>
              <div style={{ fontSize: 13 }}>{fmt(taxAmt)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "10px 0", borderTop: "2px solid var(--border)" }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>รวมทั้งสิ้น</label>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>{fmt(grandTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ส่วนลด (%)</label>
          <input type="number" min="0" max="100" step="0.01" style={{ ...inp }} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>อัตราภาษี (%)</label>
          <input type="number" min="0" max="100" step="1" style={{ ...inp }} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ประเภท VAT</label>
          <select style={{ ...inp }} value={vatType} onChange={(e) => setVatType(e.target.value)}>
            <option value="exclusive">นอก (ไม่รวม)</option>
            <option value="inclusive">ใน (รวม)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenPOForm });
