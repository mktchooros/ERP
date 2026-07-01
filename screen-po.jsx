// 🗂️ รายงานใบสั่งซื้อ — อ่านจาก localStorage key po_* (บันทึกโดย ScreenPOForm)
const ScreenPOReport = ({ setCurrent }) => {
  const [pos, setPos] = React.useState([]);
  const [filter, setFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(null);

  const load = () => {
    const all = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /^po_PO/.test(key)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.poNumber) all.push({ ...data, _key: key });
        } catch (e) {}
      }
    }
    all.sort((a, b) => (b.poDate || "").localeCompare(a.poDate || "") || (b.poNumber || "").localeCompare(a.poNumber || ""));
    setPos(all);
  };

  React.useEffect(() => { load(); }, []);

  const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => window.fmtDateGlobal(d);

  const STATUS_TONE = {
    "ร่าง": { bg: "#EEE", fg: "#666" },
    "รออนุมัติ": { bg: "#FFF3D6", fg: "#8A6100" },
    "อนุมัติแล้ว": { bg: "#E2EDDC", fg: "#2D5128" },
    "ส่งผู้ขาย": { bg: "#DCE7F5", fg: "#1B4A87" },
    "รับของบางส่วน": { bg: "#F5E6DC", fg: "#8A4A1B" },
    "รับของครบ": { bg: "#D8EFE0", fg: "#1B6E3C" },
  };

  const filtered = pos.filter((p) => {
    const q = filter.trim().toLowerCase();
    const matchQ = !q || [p.poNumber, p.supplierName, p.prNumber, p.poDate].some((v) => (v || "").toLowerCase().includes(q));
    const matchS = statusFilter === "all" || (p.status || p.approvalStatusLabel) === statusFilter;
    return matchQ && matchS;
  });

  const totalValue = filtered.reduce((s, p) => s + (+p.totalAmount || 0), 0);

  const handleDelete = (key) => {
    if (confirm("ต้องการลบใบสั่งซื้อนี้หรือไม่?")) {
      localStorage.removeItem(key);
      setSelected(null);
      load();
    }
  };

  const handlePrint = (po) => {
    const rows = (po.items || []).map((it, i) => `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${it.code || ""}</td>
      <td>${it.name || ""}</td>
      <td style="text-align:right">${fmt(it.qty)}</td>
      <td style="text-align:center">${it.unit || ""}</td>
      <td style="text-align:right">${fmt(it.cost)}</td>
      <td style="text-align:right">${fmt(it.total)}</td>
    </tr>`).join("");
    const html = `<html><head><meta charset="utf-8"><title>ใบสั่งซื้อ ${po.poNumber}</title><style>
      body{font-family:'Sarabun','TH Sarabun New',Arial,sans-serif;padding:30px;color:#000}
      .wrap{max-width:820px;margin:0 auto}
      h1{font-size:18px;text-align:center;margin:0 0 4px}
      .center{text-align:center}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px}
      td,th{border:1px solid #000;padding:4px 6px}
      th{background:#f0f0f0}
      .info td{border:1px solid #000}
      .tot td{border:none;text-align:right}
      .tot td.b{border:1px solid #000}
      @media print{body{padding:0}}
    </style></head><body><div class="wrap">
      <div class="center"><div style="font-size:20px;font-weight:700">บริษัท ชูรสยายปู จำกัด</div>
      <div style="font-size:11px">29 หมู่ 6 ตำบลหนองสูงใต้ อำเภอหนองสูง จังหวัดมุกดาหาร 49160 · เลขประจำตัวผู้เสียภาษี 0495567000363</div></div>
      <h1>ใบสั่งซื้อ / Purchase Order</h1>
      <table class="info"><tbody>
        <tr><td style="width:90px">เลขที่</td><td>${po.poNumber || ""}</td><td style="width:90px">วันที่</td><td>${fmtDate(po.poDate)}</td></tr>
        <tr><td>อ้าง PR</td><td>${po.prNumber || "—"}</td><td>สถานะ</td><td>${po.status || po.approvalStatusLabel || "—"}</td></tr>
        <tr><td>ผู้ขาย</td><td>${po.supplierName || "—"}</td><td>เลขผู้เสียภาษี</td><td>${po.supplierTax || "—"}</td></tr>
        <tr><td>เงื่อนไขชำระ</td><td>${(po.paymentMethodLabel || "—")}${po.creditDays ? " " + po.creditDays + " วัน" : ""}</td><td>กำหนดชำระ</td><td>${fmtDate(po.dueDate)}</td></tr>
        <tr><td>รับของถึง</td><td>${fmtDate(po.requiredDate)}</td><td>ส่งมอบ</td><td>${[po.incoterm, po.deliveryPlace].filter(Boolean).join(" · ") || "—"}</td></tr>
      </tbody></table>
      <table><thead><tr><th>ลำดับ</th><th>รหัส</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ราคา/หน่วย</th><th>รวม</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <table class="tot"><tbody>
        <tr><td>รวมเงิน</td><td class="b" style="width:140px">${fmt(po.subtotal)}</td></tr>
        ${po.discountAmount > 0 ? `<tr><td>ส่วนลด</td><td class="b">(${fmt(po.discountAmount)})</td></tr>` : ""}
        <tr><td>ภาษี (${po.taxRate || 0}%)</td><td class="b">${fmt(po.taxAmount)}</td></tr>
        <tr><td style="font-weight:700">รวมทั้งสิ้น</td><td class="b" style="font-weight:700">${fmt(po.totalAmount)}</td></tr>
      </tbody></table>
      ${po.notes ? `<div style="font-size:11px;margin-top:10px"><strong>หมายเหตุ:</strong> ${po.notes}</div>` : ""}
    </div></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const inp = { padding: "10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 14 };
  const StatusBadge = ({ s }) => {
    const tone = STATUS_TONE[s] || { bg: "#EEE", fg: "#666" };
    return <span style={{ background: tone.bg, color: tone.fg, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{s || "—"}</span>;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">🗂️ รายงานใบสั่งซื้อ</h1>
          <p className="page-sub">ใบสั่งซื้อทั้งหมด · ดูรายละเอียด · พิมพ์ · ลบ</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setCurrent && setCurrent("po")}>+ สร้างใบสั่งซื้อ</button>
        </div>
      </div>

      {/* Summary + filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, marginBottom: 16, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>ค้นหา</label>
          <input style={{ ...inp, width: "100%" }} placeholder="เลขที่ PO, ผู้ขาย, PR, วันที่..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>สถานะ</label>
          <select style={{ ...inp, width: "100%" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {["ร่าง", "รออนุมัติ", "อนุมัติแล้ว", "ส่งผู้ขาย", "รับของบางส่วน", "รับของครบ"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ textAlign: "right", padding: "0 4px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>มูลค่ารวม ({filtered.length} ใบ)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>฿{fmt(totalValue)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <table className="tbl" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 110 }}>เลขที่ PO</th>
              <th style={{ width: 90 }}>วันที่</th>
              <th>ผู้ขาย</th>
              <th style={{ width: 110 }}>ชำระ</th>
              <th style={{ width: 90 }}>กำหนดชำระ</th>
              <th style={{ width: 110 }}>สถานะ</th>
              <th style={{ width: 110, textAlign: "right" }}>ยอดรวม</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>ยังไม่มีใบสั่งซื้อ — กด “+ สร้างใบสั่งซื้อ”</td></tr>
            ) : filtered.map((po) => (
              <tr key={po._key} onClick={() => setSelected(po)} style={{ cursor: "pointer", background: selected?._key === po._key ? "#FFF6E8" : "transparent" }}>
                <td style={{ fontWeight: 600 }}>{po.poNumber}</td>
                <td>{fmtDate(po.poDate)}</td>
                <td>{po.supplierName || "—"}</td>
                <td style={{ fontSize: 12 }}>{po.paymentMethodLabel || "—"}{po.creditDays ? ` ${po.creditDays}ว.` : ""}</td>
                <td style={{ fontSize: 12 }}>{fmtDate(po.dueDate)}</td>
                <td><StatusBadge s={po.status || po.approvalStatusLabel} /></td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--brand)" }}>฿{fmt(po.totalAmount)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => handlePrint(po)}>🖨️</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(po._key)}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail */}
      {selected && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>ใบสั่งซื้อ {selected.poNumber}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              {[
                ["วันที่", fmtDate(selected.poDate)],
                ["ผู้ขาย", selected.supplierName || "—"],
                ["อ้าง PR", selected.prNumber || "—"],
                ["สถานะ", selected.status || selected.approvalStatusLabel || "—"],
                ["ประเภทชำระ", (selected.paymentMethodLabel || "—") + (selected.creditDays ? ` ${selected.creditDays} วัน` : "")],
                ["กำหนดชำระ", fmtDate(selected.dueDate)],
                ["รับของถึง", fmtDate(selected.requiredDate)],
                ["ผู้ขอซื้อ", [selected.requester, selected.department].filter(Boolean).join(" / ") || "—"],
              ].map(([k, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            <table className="tbl" style={{ fontSize: 12, marginBottom: 16 }}>
              <thead>
                <tr><th style={{ width: 40 }}>#</th><th style={{ width: 80 }}>รหัส</th><th>รายการ</th><th style={{ width: 70, textAlign: "right" }}>จำนวน</th><th style={{ width: 60 }}>หน่วย</th><th style={{ width: 100, textAlign: "right" }}>ราคา/หน่วย</th><th style={{ width: 100, textAlign: "right" }}>รวม</th></tr>
              </thead>
              <tbody>
                {(selected.items || []).map((it, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td>{it.code}</td>
                    <td>{it.name}</td>
                    <td style={{ textAlign: "right" }}>{fmt(it.qty)}</td>
                    <td style={{ textAlign: "center" }}>{it.unit}</td>
                    <td style={{ textAlign: "right" }}>฿{fmt(it.cost)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>฿{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, marginBottom: 16, fontSize: 14 }}>
              <div>รวมเงิน <strong>฿{fmt(selected.subtotal)}</strong></div>
              <div>ภาษี <strong>฿{fmt(selected.taxAmount)}</strong></div>
              <div style={{ color: "var(--brand)" }}>รวมทั้งสิ้น <strong style={{ fontSize: 18 }}>฿{fmt(selected.totalAmount)}</strong></div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => handlePrint(selected)}>🖨️ พิมพ์</button>
              <button className="btn btn-secondary" onClick={() => handleDelete(selected._key)}>🗑️ ลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenPOReport });
