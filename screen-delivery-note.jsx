// 👥 ลูกหนี้-เจ้าหนี้ — รวมในระบบ ERP
const ScreenCustomersCreditors = () => {
  const [tab, setTab] = React.useState(() => localStorage.getItem("parties_tab") || "customers");
  const [parties, setParties] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [openForm, setOpenForm] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const PER = 50;

  const blankCustomer = {
    id: "", name: "", type: "company", address: "", phone: "", email: "",
    contact: "", idNumber: "", bankAccount: "", paymentTerms: "", creditLimit: 0,
    status: "active", createdDate: new Date().toISOString().split("T")[0], category: "customers"
  };

  const blankCreditor = {
    id: "", name: "", type: "company", address: "", phone: "", email: "",
    contact: "", taxId: "", bankAccount: "", paymentTerms: "", outstandingAmount: 0,
    status: "active", createdDate: new Date().toISOString().split("T")[0], category: "creditors"
  };

  const [form, setForm] = React.useState({});

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("erp_parties");
      if (stored) {
        const parsed = JSON.parse(stored);
        setParties(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {}
  }, []);

  const saveParties = (next) => {
    setParties(next);
    try { localStorage.setItem("erp_parties", JSON.stringify(next)); } catch (e) {}
  };

  const currentList = parties.filter(p => p.category === tab);
  const filtered = currentList.filter(p => {
    const q = (search.trim() || "").toLowerCase();
    const matchQ = !q || (p.name || "").toLowerCase().includes(q) || (p.phone || "").includes(q) || (p.id || "").toLowerCase().includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchQ && matchStatus;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const curPage = Math.min(page, pages - 1);
  const shown = filtered.slice(curPage * PER, (curPage + 1) * PER);

  React.useEffect(() => { setPage(0); }, [search, filterStatus, tab]);

  const openAdd = () => {
    const nextNum = parties.filter(p => p.category === tab).reduce((m, p) => {
      const n = parseInt((p.id || "").replace(/D/g, "")) || 0;
      return Math.max(m, n);
    }, 0) + 1;
    const prefix = tab === "customers" ? "C" : "V";
    const blank = tab === "customers" ? blankCustomer : blankCreditor;
    setForm({ ...blank, id: prefix + String(nextNum).padStart(3, "0") });
    setEditId(null);
    setOpenForm(true);
  };

  const openEdit = (p) => { setForm({ ...p }); setEditId(p.id); setOpenForm(true); };

  const saveForm = () => {
    if (!form.name || !form.name.trim()) { alert("กรุณากรอกชื่อ"); return; }
    let next;
    if (editId !== null) {
      next = parties.map(p => (p.id === editId ? form : p));
    } else {
      if (parties.some(p => p.id === form.id)) { alert("รหัสซ้ำแล้ว"); return; }
      next = [form, ...parties];
    }
    saveParties(next);
    setOpenForm(false);
    const msgText = editId !== null ? "✅ บันทึกแก้ไขแล้ว" : "✅ เพิ่มใหม่แล้ว";
    setMsg(msgText);
    setTimeout(() => setMsg(""), 2200);
  };

  const deleteParty = (p) => {
    const typename = tab === "customers" ? "ลูกหนี้" : "เจ้าหนี้";
    if (!confirm(`ลบ${typename} ${p.id} — ${p.name}?`)) return;
    saveParties(parties.filter(x => x.id !== p.id));
    setMsg(`✅ ลบ${typename}แล้ว`);
    setTimeout(() => setMsg(""), 2200);
  };

  const duplicateParty = (p) => {
    const nextNum = parties.filter(pr => pr.category === tab).reduce((m, pr) => {
      const n = parseInt((pr.id || "").replace(/D|V|C/g, "")) || 0;
      return Math.max(m, n);
    }, 0) + 1;
    const prefix = tab === "customers" ? "C" : "V";
    const newParty = { ...p, id: prefix + String(nextNum).padStart(3, "0") };
    saveParties([newParty, ...parties]);
    const typename = tab === "customers" ? "ลูกหนี้" : "เจ้าหนี้";
    setMsg(`✅ สำเนา${typename}แล้ว`);
    setTimeout(() => setMsg(""), 2200);
  };

  const printParty = (p) => {
    const typename = tab === "customers" ? "ลูกหนี้" : "เจ้าหนี้";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${p.name}</title><style>body{font-family:"IBM Plex Sans Thai",sans-serif;margin:40px;color:#333;line-height:1.6}h1{color:#B6241F;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f0f0f0;padding:8px;text-align:left;font-weight:600;border-bottom:2px solid #B6241F}td{padding:8px;border-bottom:1px solid #ddd}.label{font-weight:600;color:#666;width:200px}</style></head><body><h1>${typename}: ${p.name} (${p.id})</h1><table><tr><td class="label">ชื่อ</td><td>${p.name}</td></tr><tr><td class="label">ประเภท</td><td>${p.type === "company" ? "บริษัท" : "บุคคลธรรมชาติ"}</td></tr><tr><td class="label">ที่อยู่</td><td>${p.address || "—"}</td></tr><tr><td class="label">เบอร์โทร</td><td>${p.phone || "—"}</td></tr><tr><td class="label">อีเมล</td><td>${p.email || "—"}</td></tr><tr><td class="label">ผู้ติดต่อ</td><td>${p.contact || "—"}</td></tr><tr><td class="label">บัญชีธนาคาร</td><td>${p.bankAccount || "—"}</td></tr><tr><td class="label">เงื่อนไขการชำระเงิน</td><td>${p.paymentTerms || "—"}</td></tr><tr><td class="label">${tab === "customers" ? "ขีดเครดิต" : "ยอดค้าง"}</td><td>${(tab === "customers" ? p.creditLimit : p.outstandingAmount || 0).toLocaleString("th-TH")}</td></tr><tr><td class="label">สถานะ</td><td>${p.status === "active" ? "ใช้งาน" : p.status === "inactive" ? "ปิด" : "ระงับ"}</td></tr></table><p style="margin-top:40px;color:#999;font-size:12px">พิมพ์เมื่อ ${window.fmtDateGlobal(new Date().toISOString().slice(0,10))} ${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}</p></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const calcAging = (createdDate) => {
    if (!createdDate) return "—";
    const created = new Date(createdDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    created.setHours(0, 0, 0, 0);
    const days = Math.floor((today - created) / (1000 * 60 * 60 * 24));
    if (days < 1) return "0";
    if (days <= 30) return `${days}d`;
    if (days <= 365) return `${Math.floor(days / 30)}m`;
    return `${Math.floor(days / 365)}y`;
  };

  const exportToExcel = () => {
    let csv = "ลำดับ,รหัส,ชื่อ,ประเภท,ที่อยู่,เบอร์โทร,อีเมล,ผู้ติดต่อ,บัญชีธนาคาร,เงื่อนไขการชำระ";
    if (tab === "customers") csv += ",เลขประจำตัว,ขีดเครดิต,สถานะ,วันลงทะเบียน";
    else csv += ",เลขประจำตัวผู้เสียภาษี,ยอดค้างจ่าย,สถานะ,วันลงทะเบียน";
    csv += "\n";

    filtered.forEach((p, i) => {
      const row = [
        i + 1, `"${p.id}"`, `"${p.name}"`, `"${p.type}"`, `"${p.address || ""}"`,
        `"${p.phone || ""}"`, `"${p.email || ""}"`, `"${p.contact || ""}"`, 
        `"${p.bankAccount || ""}"`, `"${p.paymentTerms || ""}"`,
      ];
      if (tab === "customers") {
        row.push(`"${p.idNumber || ""}"`, p.creditLimit || 0, `"${p.status}"`, p.createdDate || "");
      } else {
        row.push(`"${p.taxId || ""}"`, p.outstandingAmount || 0, `"${p.status}"`, p.createdDate || "");
      }
      csv += row.join(",") + "\n";
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const fname = tab === "customers" ? "lukhna.csv" : "jahnee.csv";
    link.setAttribute("href", url);
    link.setAttribute("download", fname);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMsg("✅ ส่งออก Excel แล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  const printList = () => {
    const typename = tab === "customers" ? "ลูกหนี้" : "เจ้าหนี้";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>รายชื่อ${typename}</title><style>body{font-family:"IBM Plex Sans Thai",sans-serif;margin:20px;color:#333}h1{text-align:center;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#B6241F;color:#fff;padding:8px;text-align:left;font-weight:600}td{padding:8px;border-bottom:1px solid #ddd}tr:nth-child(even){background:#f9f9f9}.code{font-family:monospace;font-weight:600}</style></head><body><h1>รายชื่อ${typename} — ${window.fmtDateGlobal(new Date().toISOString().slice(0,10))}</h1><table><thead><tr><th style="width:80px">รหัส</th><th>ชื่อ</th><th>ที่อยู่</th><th style="width:100px">เบอร์โทร</th><th style="width:140px">อีเมล</th><th style="width:80px">${tab === "customers" ? "ขีดเครดิต" : "ยอดค้าง"}</th><th style="width:80px">สถานะ</th></tr></thead><tbody>${filtered.map(p => `<tr><td class="code">${p.id}</td><td>${p.name}</td><td>${p.address || "—"}</td><td>${p.phone || "—"}</td><td>${p.email || "—"}</td><td style="text-align:right">${tab === "customers" ? (p.creditLimit || 0).toLocaleString("th-TH") : (p.outstandingAmount || 0).toLocaleString("th-TH")}</td><td>${p.status === "active" ? "ใช้งาน" : "ปิด"}</td></tr>`).join("")}</tbody></table><p style="text-align:center;margin-top:30px;color:#999;font-size:11px">พิมพ์เมื่อ ${window.fmtDateGlobal(new Date().toISOString().slice(0,10))} ${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}</p></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const statusBadge = (status) => {
    const map = { active: "ใช้งาน", inactive: "ปิด", suspended: "ระงับ" };
    const badgeClass = status === "active" ? "b-done" : status === "inactive" ? "b-neutral" : "b-wait";
    return <span className={`badge ${badgeClass}`}>{map[status] || "—"}</span>;
  };

  const typename = tab === "customers" ? "ลูกหนี้" : "เจ้าหนี้";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">👥 {tab === "customers" ? "ลูกหนี้" : "เจ้าหนี้"}</h1>
          <p className="page-sub">ทั้งหมด {currentList.length.toLocaleString("th-TH")} {typename === "ลูกหนี้" ? "ราย" : "ราย"}</p>
        </div>
        <div className="page-actions">
          <button className={"btn" + (tab === "customers" ? " btn-primary" : "")} onClick={() => { setTab("customers"); localStorage.setItem("parties_tab", "customers"); }}>
            👥 ลูกหนี้ ({parties.filter(p => p.category === "customers").length})
          </button>
          <button className={"btn" + (tab === "creditors" ? " btn-primary" : "")} onClick={() => { setTab("creditors"); localStorage.setItem("parties_tab", "creditors"); }}>
            🏢 เจ้าหนี้ ({parties.filter(p => p.category === "creditors").length})
          </button>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginLeft: "auto" }}>➕ เพิ่ม{typename}</button>
        </div>
      </div>

      {msg && <div className={"alert " + (msg.includes("✅") ? "success" : "")}>{msg}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input type="text" placeholder="ค้นหาชื่อ / เบอร์โทร / รหัส…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">ทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ปิด</option>
          <option value="suspended">ระงับ</option>
        </select>
        <button className="btn" onClick={printList}>🖨️ ปริ้น</button>
        <button className="btn" onClick={exportToExcel}>📊 Excel</button>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 80 }}>รหัส</th>
              <th>ชื่อ</th>
              <th style={{ width: 110 }}>เบอร์โทร</th>
              <th style={{ width: 120 }}>อีเมล</th>
              {tab === "customers" ? <><th style={{ width: 100 }}>ขีดเครดิต</th><th style={{ width: 60 }}>Aging</th></> : <><th style={{ width: 100 }}>ยอดค้าง</th><th style={{ width: 60 }}>Aging</th></>}
              <th style={{ width: 70 }}>สถานะ</th>
              <th style={{ width: 160 }}>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>ไม่พบ{typename}</td></tr>
            ) : (
              shown.map((p) => (
                <tr key={p.id}>
                  <td className="code">{p.id}</td>
                  <td><div style={{ fontWeight: 500 }}>{p.name}</div>{p.contact && <div className="small muted">{p.contact}</div>}</td>
                  <td className="small tnum">{p.phone || "—"}</td>
                  <td className="small">{p.email || "—"}</td>
                  <td className="num tnum" style={{ fontWeight: 600 }}>{tab === "customers" ? (p.creditLimit || 0).toLocaleString("th-TH") : (p.outstandingAmount || 0).toLocaleString("th-TH")}</td>
                  <td className="small muted">{calcAging(p.createdDate)}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button className="btn btn-sm" onClick={() => openEdit(p)} title="แก้ไข">✏️</button>
                    <button className="btn btn-sm" onClick={() => duplicateParty(p)} title="สำเนา">📋</button>
                    <button className="btn btn-sm" onClick={() => printParty(p)} title="ปริ้น">🖨️</button>
                    <button className="btn btn-sm" onClick={() => deleteParty(p)} title="ลบ" style={{ color: "var(--brand)" }}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}>
          <button className="btn btn-sm" disabled={curPage === 0} onClick={() => setPage(curPage - 1)}>‹ ก่อนหน้า</button>
          <span className="small muted">หน้า {curPage + 1} / {pages} · {shown.length} จาก {filtered.length}</span>
          <button className="btn btn-sm" disabled={curPage >= pages - 1} onClick={() => setPage(curPage + 1)}>ถัดไป ›</button>
        </div>
      )}

      {openForm && (
        <div className="modal-overlay" onClick={() => setOpenForm(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h3 className="card-title">{editId !== null ? `✏️ แก้ไข${typename}` : `➕ เพิ่ม${typename}ใหม่`}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setOpenForm(false)}>✕</button>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-grid-2">
                  <div><label className="small muted">รหัส</label><input type="text" value={form.id || ""} disabled={editId !== null} onChange={(e) => setForm({ ...form, id: e.target.value })} /></div>
                  <div><label className="small muted">ประเภท *</label><select value={form.type || "company"} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="company">บริษัท</option><option value="individual">บุคคลธรรมชาติ</option></select></div>
                </div>
                <div><label className="small muted">ชื่อ *</label><input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="small muted">ที่อยู่</label><textarea value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ minHeight: "60px" }} /></div>
                <div className="form-grid-2">
                  <div><label className="small muted">เบอร์โทร</label><input type="tel" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="small muted">อีเมล</label><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><label className="small muted">ผู้ติดต่อ</label><input type="text" value={form.contact || ""} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
                {tab === "customers" ? (
                  <div className="form-grid-2">
                    <div><label className="small muted">เลขประจำตัวประชาชน</label><input type="text" value={form.idNumber || ""} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></div>
                    <div><label className="small muted">ขีดเครดิต</label><input type="number" value={form.creditLimit || 0} onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                ) : (
                  <div className="form-grid-2">
                    <div><label className="small muted">เลขประจำตัวผู้เสียภาษี</label><input type="text" value={form.taxId || ""} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></div>
                    <div><label className="small muted">ยอดค้างจ่าย</label><input type="number" value={form.outstandingAmount || 0} onChange={(e) => setForm({ ...form, outstandingAmount: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                )}
                <div className="form-grid-2">
                  <div><label className="small muted">บัญชีธนาคาร</label><input type="text" value={form.bankAccount || ""} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} /></div>
                  <div><label className="small muted">เงื่อนไขการชำระเงิน</label><input type="text" value={form.paymentTerms || ""} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="Net 30" /></div>
                </div>
                <div><label className="small muted">สถานะ</label><select value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">ใช้งาน</option><option value="inactive">ปิด</option><option value="suspended">ระงับ</option></select></div>
              </div>
              <div className="form-actions">
                <button className="btn" onClick={() => setOpenForm(false)}>ยกเลิก</button>
                <button className="btn btn-primary" onClick={saveForm}>💾 บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenCustomersCreditors });
