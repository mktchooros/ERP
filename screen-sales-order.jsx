// แก้ไขใบสั่งขาย — โหลดจาก localStorage, แก้ไข, บันทึกกลับ (ข้อมูลคงอยู่หลังรีเฟรช)
const ScreenSalesOrderEdit = ({ orderNumber, onClose, onSave }) => {
  const MENU_LIST = (typeof loadMenuLive === "function") ? loadMenuLive() : (typeof MENU !== "undefined" ? MENU : []);
  const customers = React.useMemo(() => {try {return typeof loadCustomers === "function" ? loadCustomers() : [];} catch (e) {return [];}}, []);

  const storageKey = `sales_order_${orderNumber}`;
  const [loaded, setLoaded] = React.useState(false);
  const [seqNumber, setSeqNumber] = React.useState(""); // เลขลำดับที่แก้ไขได้ (NNNN)
  const [orderDate, setOrderDate] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [salesPerson, setSalesPerson] = React.useState("");
  const [shippingMethod, setShippingMethod] = React.useState("");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [shippingStatus, setShippingStatus] = React.useState("order");
  const [poNumber, setPoNumber] = React.useState("");
  const [poDate, setPoDate] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [docType, setDocType] = React.useState("tax-invoice");
  const [creditDays, setCreditDays] = React.useState(7);
  const [paymentStatus, setPaymentStatus] = React.useState("unpaid");
  const [discount, setDiscount] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(7);
  const [vatType, setVatType] = React.useState("exclusive");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [nid, setNid] = React.useState(1);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(storageKey));
      if (!o) { setMsg("❌ ไม่พบข้อมูลใบสั่งขาย"); return; }
      setOrderDate(o.orderDate || "");
      setCustomerId(o.customerId || "");
      setCustomerName(o.customerName || "");
      setCustomerAddress(o.customerAddress || "");
      setCustomerPhone(o.customerPhone || "");
      setDeliveryDate(o.deliveryDate || "");
      setSalesPerson(o.salesPerson || "");
      setShippingMethod(o.shippingMethod || "");
      setTrackingNumber(o.trackingNumber || "");
      setShippingStatus(o.shippingStatus || "order");
      setPoNumber(o.poNumber || "");
      setPoDate(o.poDate || "");
      setPaymentMethod(o.paymentMethod || "cash");
      setDocType(o.docType || "tax-invoice");
      setCreditDays(o.creditDays || 7);
      setPaymentStatus(o.paymentStatus || "unpaid");
      setDiscount(o.discount || 0);
      setTaxRate(o.taxRate != null ? o.taxRate : 7);
      setVatType(o.vatType || "exclusive");
      setNotes(o.notes || "");
      setSeqNumber((o.orderNumber || orderNumber).replace(/^SO\d{4}/, ""));
      const its = (Array.isArray(o.items) ? o.items : []).map((it, i) => ({
        id: i, code: it.code || "", name: it.name || "", qty: it.qty || 0, unit: it.unit || "ซอง", price: it.price || 0, disc: it.disc || 0
      }));
      setItems(its.length ? its : [{ id: 0, code: "", name: "", qty: 1, unit: "ซอง", price: 0, disc: 0 }]);
      setNid(its.length || 1);
      setLoaded(true);
    } catch (e) { setMsg("❌ โหลดข้อมูลไม่สำเร็จ: " + e.message); }
  }, [orderNumber]);

  const setItem = (id, patch) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  const addRow = () => { setItems((prev) => [...prev, { id: nid, code: "", name: "", qty: 1, unit: "ซอง", price: 0, disc: 0 }]); setNid(nid + 1); };
  const rmRow = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const pickProduct = (id, code) => {
    const p = MENU_LIST.find((m) => m.code === code);
    setItem(id, { code, name: p ? p.name : "", price: p ? p.price : 0, unit: (p && p.unit) || "ซอง" });
  };

  const lines = items.filter((i) => i.code || i.name).map((i) => {
    const qty = parseFloat(i.qty) || 0, price = parseFloat(i.price) || 0;
    const disc = parseFloat(i.disc) || 0;
    const gross = qty * price;
    const lineDiscAmt = Math.min(Math.max(disc, 0), gross);
    return { ...i, disc, lineDiscAmt, lineTotal: gross - lineDiscAmt };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discAmt = subtotal * ((parseFloat(discount) || 0) / 100);
  const afterDisc = subtotal - discAmt;
  const rate = (parseFloat(taxRate) || 0) / 100;
  const taxAmt = vatType === "inclusive" ? afterDisc * rate / (1 + rate) : afterDisc * rate;
  const grandTotal = vatType === "inclusive" ? afterDisc : afterDisc + taxAmt;
  const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const save = () => {
    if (!customerName.trim()) { setMsg("⚠️ กรุณากรอกชื่อลูกค้า"); setTimeout(() => setMsg(""), 2500); return; }
    if (lines.length === 0) { setMsg("⚠️ กรุณาเพิ่มรายการสินค้า"); setTimeout(() => setMsg(""), 2500); return; }
    // สร้างเลขที่ใหม่จากรูปแบบ SO{YYMM} + เลขลำดับที่แก้
    const ds = orderDate.replace(/-/g, "").slice(2, 6);
    const digits = String(seqNumber).trim().replace(/\D/g, "");
    if (!digits) { setMsg("⚠️ เลขลำดับใบสั่งขายต้องเป็นตัวเลข"); setTimeout(() => setMsg(""), 2500); return; }
    const newNumber = `SO${ds}${digits.padStart(4, "0")}`;
    const newKey = `sales_order_${newNumber}`;
    const numberChanged = newNumber !== orderNumber;
    if (numberChanged && localStorage.getItem(newKey)) {
      setMsg(`⚠️ เลขที่ ${newNumber} มีอยู่แล้ว — กรุณาเปลี่ยนเลขใหม่`);
      setTimeout(() => setMsg(""), 3500);
      return;
    }
    const order = {
      orderNumber: newNumber, orderDate, customerId, customerName: customerName.trim(),
      customerAddress, customerPhone, deliveryDate, salesPerson: salesPerson.trim(), shippingMethod, trackingNumber, shippingStatus, poNumber, poDate, docType,
      paymentMethod, creditDays: paymentMethod === "credit" ? creditDays : null,
      items: lines.map((l) => ({ code: l.code, name: l.name, qty: parseFloat(l.qty) || 0, unit: l.unit || "ซอง", price: parseFloat(l.price) || 0, disc: parseFloat(l.disc) || 0, discountAmount: l.lineDiscAmt || 0, total: l.lineTotal })),
      subtotal, discount: parseFloat(discount) || 0, discountAmount: discAmt,
      vatType, taxRate: parseFloat(taxRate) || 0, taxAmount: taxAmt,
      totalAmount: grandTotal, paymentStatus, notes,
      savedAt: new Date().toLocaleString("th-TH")
    };
    try {
      localStorage.setItem(newKey, JSON.stringify(order));
      if (numberChanged) localStorage.removeItem(storageKey); // ลบคีย์เก่าเมื่อเปลี่ยนเลขที่
      window.dataCache?.invalidate?.("sales_list");
      window.dataCache?.invalidate?.("sales_report");
      setMsg("✅ บันทึกการแก้ไขแล้ว");
      setTimeout(() => { onSave && onSave(); }, 600);
    } catch (e) { setMsg("❌ บันทึกไม่สำเร็จ: " + e.message); }
  };

  const inp = { padding: "8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, width: "100%" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(34,26,20,.45)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg, #fff)", borderRadius: 14, width: "100%", maxWidth: 1000, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>✏️ แก้ไขใบสั่งขาย</h2>
            <div className="small muted" style={{ marginTop: 2 }}>เลขที่ {orderNumber}</div>
          </div>
          <button className="btn" onClick={onClose}>✕ ปิด</button>
        </div>

        <div style={{ padding: 24 }}>
          {msg && <div className="alert" style={{ background: msg.startsWith("✅") ? "var(--leaf-soft)" : "var(--warn-soft)", border: "1px solid #D8C49E", color: "var(--ink-2)", marginBottom: 14 }}>{msg}</div>}

          {!loaded ? <div className="muted" style={{ padding: 20 }}>กำลังโหลด…</div> :
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เลขที่ใบสั่งขาย</label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <span style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "var(--leaf-soft, #eef3e6)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "6px 0 0 6px", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", whiteSpace: "nowrap" }}>SO{orderDate.replace(/-/g, "").slice(2, 6)}</span>
                  <input value={seqNumber} onChange={(e) => setSeqNumber(e.target.value.replace(/\D/g, ""))} inputMode="numeric" style={{ ...inp, borderRadius: "0 6px 6px 0" }} />
                </div>
              </div>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่</label>
                <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} style={inp} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ลูกค้า</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} list="cust-edit-list" style={inp} />
                <datalist id="cust-edit-list">{customers.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ใบส่ง PO</label>
                <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} style={inp} />
              </div>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันที่ PO</label>
                <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>ที่อยู่ลูกค้า</label>
                <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} style={inp} />
              </div>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>เบอร์โทรลูกค้า</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>วันกำหนดส่ง</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={inp} />
              </div>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>พนักงานขาย</label>
                <input value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} placeholder="ชื่อพนักงานขาย" style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="small muted" style={{ display: "block", marginBottom: 6 }}>ประเภทเอกสารที่ออก</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { v: "tax-invoice", t: "ออกใบกำกับภาษี" },
                  { v: "cash-bill", t: "ออกบิลเงินสด" },
                  { v: "temp-delivery", t: "ออกใบส่งสินค้าชั่วคราว" },
                  { v: "loan", t: "ออกใบยืม" },
                ].map((o) =>
                  <label key={o.v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "8px 14px", borderRadius: 6, border: `1px solid ${docType === o.v ? "var(--leaf, #6f8f3f)" : "var(--border)"}`, background: docType === o.v ? "var(--leaf-soft, #eef3e6)" : "#fff", fontWeight: docType === o.v ? 600 : 400, fontSize: 13 }}>
                    <input type="radio" name="docTypeEdit" value={o.v} checked={docType === o.v} onChange={(e) => setDocType(e.target.value)} />
                    {o.t}
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
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
                <input type="number" min="0" value={creditDays} onChange={(e) => setCreditDays(e.target.value)} style={inp} />
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
                  <option value="exclusive">VAT นอก</option>
                  <option value="inclusive">VAT ใน</option>
                </select>
              </div>
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>สถานะชำระ</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={inp}>
                  <option value="unpaid">ค้างชำระ</option>
                  <option value="partial">ชำระบางส่วน</option>
                  <option value="paid">ชำระแล้ว</option>
                </select>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16, overflowX: "auto" }}>
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
                        <td><input value={it.code} onChange={(e) => setItem(it.id, { code: e.target.value })} style={{ ...inp, fontSize: 11 }} /></td>
                        <td>
                          <select value={it.code} onChange={(e) => pickProduct(it.id, e.target.value)} style={{ ...inp, fontSize: 11 }}>
                            <option value="">{it.name || "-- เลือกสินค้า --"}</option>
                            {MENU_LIST.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
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
              <div>
                <label className="small muted" style={{ display: "block", marginBottom: 4 }}>หมายเหตุ</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ ...inp, resize: "vertical" }} />
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
                    <button className="btn" style={{ flex: 1 }} onClick={onClose}>ยกเลิก</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={save}>💾 บันทึกการแก้ไข</button>
                  </div>
                </div>
              </div>
            </div>
          </>
          }
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenSalesOrderEdit });
