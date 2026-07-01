// 📋 ประวัติการเบิกสินค้า FG — อ่านจาก localStorage erp_fg_withdraw_*
const ScreenWithdrawalFGHistory = () => {
  const [records, setRecords] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [openKey, setOpenKey] = React.useState(null);
  const [msg, setMsg] = React.useState("");

  const MENU_LIST = typeof MENU !== "undefined" ? MENU : [];
  const prodName = (code) => {
    const p = MENU_LIST.find(m => m.code === code);
    return p ? `${p.emoji || ""} ${p.name}` : code;
  };

  const load = React.useCallback(() => {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("erp_fg_withdraw_")) {
        try {
          const rec = JSON.parse(localStorage.getItem(key));
          list.push({ ...rec, key });
        } catch (e) {}
      }
    }
    setRecords(list.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const del = (key) => {
    if (!confirm("ลบรายการเบิก FG นี้? (จะไม่คืนสต๊อกอัตโนมัติ)")) return;
    localStorage.removeItem(key);
    setMsg("✅ ลบรายการแล้ว");
    setTimeout(() => setMsg(""), 3000);
    load();
  };

  const fmtDate = (d) => window.fmtDateGlobal(d);

  const typeBadge = (t) => {
    switch (t) {
      case "ขาย": return { bg: "#dbeafe", color: "#2563eb" };
      case "ชงชิม": return { bg: "#fce7f3", color: "#db2777" };
      case "ทดลอง": return { bg: "#fef3c7", color: "#d97706" };
      case "แจกฟรี": return { bg: "#dcfce7", color: "#16a34a" };
      case "ย้าย": return { bg: "#ede9fe", color: "#7c3aed" };
      default: return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const filtered = records.filter(r => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || (r.docNumber || "").toLowerCase().includes(q) || (r.withdrawBy || "").toLowerCase().includes(q) || (r.date || "").includes(q) || (r.reference || "").toLowerCase().includes(q);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchQ && matchType;
  });

  // สรุปจำนวนตามประเภท
  const typeTotals = {};
  records.forEach(r => {
    const qty = (r.items || []).reduce((s, it) => s + (parseInt(it.qty, 10) || 0), 0);
    typeTotals[r.type] = (typeTotals[r.type] || 0) + qty;
  });

  const types = ["ขาย", "ชงชิม", "ทดลอง", "แจกฟรี", "ย้าย"];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📋 ประวัติการเบิกสินค้า FG</h1>
          <p className="page-sub">รายการเบิกสินค้าสำเร็จรูปทั้งหมด {records.length} ใบ · คลิกแถวเพื่อดูรายละเอียด</p>
        </div>
      </div>

      {msg && <div className="alert" style={{ background: "var(--leaf-soft)", border: "1px solid #B9D4B2", color: "#2D5128", marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 18 }}>
        {types.map(t => {
          const badge = typeBadge(t);
          return (
            <div key={t} className="card">
              <div className="card-body" style={{ textAlign: "center", padding: 14 }}>
                <div style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color, marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{(typeTotals[t] || 0).toLocaleString()}</div>
                <div className="small muted">ซอง</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input placeholder="ค้นหา เลขที่เอกสาร / ผู้เบิก / วันที่ / อ้างอิง…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
          <option value="all">ทุกประเภท</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 110 }}>วันที่</th>
              <th>เลขที่เอกสาร</th>
              <th style={{ width: 90 }}>ประเภท</th>
              <th>ผู้เบิก</th>
              <th>อ้างอิง</th>
              <th className="num">จำนวนรายการ</th>
              <th className="num">รวมซอง</th>
              <th style={{ width: 70 }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ยังไม่มีประวัติการเบิก FG</td></tr>
            ) : filtered.map(r => {
              const badge = typeBadge(r.type);
              const totalQty = (r.items || []).reduce((s, it) => s + (parseInt(it.qty, 10) || 0), 0);
              return (
                <React.Fragment key={r.key}>
                  <tr onClick={() => setOpenKey(openKey === r.key ? null : r.key)} style={{ cursor: "pointer" }}>
                    <td className="small muted">{fmtDate(r.date)}</td>
                    <td><span className="code">{r.docNumber || "—"}</span></td>
                    <td><span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{r.type || "—"}</span></td>
                    <td className="small">{r.withdrawBy || "—"}</td>
                    <td className="small">{r.reference || "—"}</td>
                    <td className="num tnum">{(r.items || []).length}</td>
                    <td className="num tnum" style={{ fontWeight: 600 }}>{totalQty.toLocaleString()}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); if (typeof printFGWithdrawal === "function") printFGWithdrawal(r, MENU_LIST, fmtDate); }} title="พิมพ์">🖨️</button>
                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); del(r.key); }} style={{ color: "var(--brand)" }} title="ลบ">🗑️</button>
                    </td>
                  </tr>
                  {openKey === r.key && (
                    <tr>
                      <td colSpan={8} style={{ background: "var(--surface-2)", padding: 14 }}>
                        <div className="small muted" style={{ marginBottom: 8 }}>
                          {r.approveBy ? <span>ผู้อนุมัติ: {r.approveBy} · </span> : null}
                          {r.reason ? <span>หมายเหตุ: {r.reason} · </span> : null}
                          บันทึกเมื่อ {r.savedAt || "—"}
                        </div>
                        <table className="tbl" style={{ background: "white", borderRadius: 8 }}>
                          <thead><tr><th>รหัส</th><th>สินค้า</th><th>ล็อต</th><th className="num">จำนวน</th><th>หน่วย</th><th>หมายเหตุ</th></tr></thead>
                          <tbody>
                            {(r.items || []).map((it, idx) => (
                              <tr key={idx}>
                                <td className="code">{it.product}</td>
                                <td className="small">{prodName(it.product)}</td>
                                <td className="small">{it.lot || "—"}</td>
                                <td className="num tnum">{it.qty}</td>
                                <td className="small">{it.unit || "ซอง"}</td>
                                <td className="small">{it.note || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenWithdrawalFGHistory });
