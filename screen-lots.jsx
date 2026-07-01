// 📋 ใบยืม — บันทึกใบยืมอุปกรณ์/สินค้า
const ScreenLoanForm = () => {
  const [loans, setLoans] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState("report");
  const [form, setForm] = React.useState({
    loanNo: "", date: new Date().toISOString().split("T")[0],
    borrowerName: "", itemDescription: "", quantity: 1, unit: "", returnDate: "", notes: "", status: "active",
  });
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    try {
      const s = localStorage.getItem('erp_loan_forms');
      if (s) setLoans(JSON.parse(s));
    } catch(e) {}
  }, []);

  const saveLoans = (next) => {
    setLoans(next);
    try { localStorage.setItem('erp_loan_forms', JSON.stringify(next)); } catch(e) {}
  };

  const filtered = search.trim()
    ? loans.filter(l => 
        (l.loanNo || "").toLowerCase().includes(search.toLowerCase())
        || (l.borrowerName || "").toLowerCase().includes(search.toLowerCase())
        || (l.itemDescription || "").toLowerCase().includes(search.toLowerCase())
      )
    : loans;

  const onSaveLoan = () => {
    if (!form.date || !form.borrowerName || !form.loanNo || !form.itemDescription) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const newLoan = { ...form };
    saveLoans([newLoan, ...loans]);
    setTab("report");
    setMsg("✅ บันทึกใบยืมแล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  const markReturned = (idx) => {
    const updated = loans.map((l, i) => (i !== idx) ? l : { ...l, status: "returned", returnedDate: new Date().toISOString().split("T")[0] });
    saveLoans(updated);
    setMsg("✅ ระบุการคืนของแล้ว");
    setTimeout(() => setMsg(""), 2200);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📋 ใบยืม</h1>
          <p className="page-sub">บันทึกใบยืมอุปกรณ์และสินค้า</p>
        </div>
        <div className="page-actions">
          <button className={`btn${tab === "report" ? " btn-primary" : ""}`} onClick={() => setTab("report")}>
            รายงาน <span className="count">{filtered.length}</span>
          </button>
          <button className={`btn${tab === "new" ? " btn-primary" : ""}`} onClick={() => setTab("new")}>
            ➕ เพิ่มใหม่
          </button>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes("✅") ? "success" : ""}`}>{msg}</div>}

      {tab === "report" && (
        <div className="card">
          <div className="card-head" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 className="card-title" style={{ flex: 1 }}>ทั้งหมด</h3>
            <input type="text" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่ใบยืม</th>
                  <th>วันที่ยืม</th>
                  <th>ผู้ยืม</th>
                  <th>รายการ</th>
                  <th>จำนวน</th>
                  <th style={{ width: 70 }}>สถานะ</th>
                  <th style={{ width: 100 }}>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>ไม่มีรายการ</td></tr>
                ) : filtered.map((loan, idx) => (
                  <tr key={idx}>
                    <td><span className="code">{loan.loanNo}</span></td>
                    <td>{loan.date}</td>
                    <td>{loan.borrowerName}</td>
                    <td>{loan.itemDescription}</td>
                    <td className="num">{loan.quantity} {loan.unit}</td>
                    <td><span className={`badge ${loan.status === "returned" ? "b-done" : "b-wait"}`}>{loan.status === "returned" ? "คืนแล้ว" : "ยืมอยู่"}</span></td>
                    <td style={{ display: "flex", gap: 5 }}>
                      {loan.status !== "returned" && <button className="btn btn-sm" onClick={() => markReturned(loans.indexOf(loan))} title="ระบุคืน">✓</button>}
                      <button className="btn btn-sm" style={{ color: "var(--brand)" }} onClick={() => { setLoans(loans.filter((_, i) => i !== idx)); }} title="ลบ">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "new" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">➕ เพิ่มใบยืม</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div><label className="small muted">วันที่ยืม</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="small muted">เลขที่ใบยืม</label><input type="text" placeholder="LN000001" value={form.loanNo} onChange={e => setForm({ ...form, loanNo: e.target.value })} /></div>
              <div><label className="small muted">ผู้ยืม</label><input type="text" value={form.borrowerName} onChange={e => setForm({ ...form, borrowerName: e.target.value })} /></div>
            </div>

            <div><label className="small muted">รายการที่ยืม</label><input type="text" value={form.itemDescription} onChange={e => setForm({ ...form, itemDescription: e.target.value })} /></div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div><label className="small muted">จำนวน</label><input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 1 })} /></div>
              <div><label className="small muted">หน่วย</label><input type="text" placeholder="ชิ้น" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><label className="small muted">คาดว่าวันคืน</label><input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} /></div>
            </div>

            <div><label className="small muted">หมายเหตุ</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 60 }} /></div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={onSaveLoan} style={{ flex: 1 }}>💾 บันทึก</button>
              <button className="btn" onClick={() => setTab("report")}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenLoanForm });
