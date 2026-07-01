// 💰 ค่าใช้จ่าย — รายการทั้งหมด

const ScreenExpense = () => {
  const [list, setList] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [form, setForm] = React.useState({
    date: new Date().toISOString().split('T')[0],
    category: "อื่นๆ",
    description: "",
    amount: ""
  });

  React.useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('erp_expenses') || '[]');
      setList(data);
    } catch(e) {}
  }, []);

  const handleOpen = (idx = null) => {
    if (idx !== null) {
      const item = list[idx];
      setForm(item);
      setEditIdx(idx);
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        category: "อื่นๆ",
        description: "",
        amount: ""
      });
      setEditIdx(null);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.date || !form.description || !form.amount) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }

    try {
      let updated = [...list];
      if (editIdx !== null) {
        updated[editIdx] = { ...form, amount: parseFloat(form.amount) };
      } else {
        updated.push({
          id: `EXP${Date.now()}`,
          ...form,
          amount: parseFloat(form.amount)
        });
      }
      setList(updated);
      localStorage.setItem('erp_expenses', JSON.stringify(updated));
      setOpen(false);
      alert("บันทึกสำเร็จ");
    } catch(e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  const handleDelete = (idx) => {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const updated = list.filter((_, i) => i !== idx);
    setList(updated);
    localStorage.setItem('erp_expenses', JSON.stringify(updated));
  };

  const filtered = list.filter(item =>
    (item.date || "").includes(search) ||
    (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">💰 ค่าใช้จ่าย</h1>
        <p className="page-desc">บันทึกและจัดการค่าใช้จ่ายต่างๆ</p>
      </div>

      <div className="filter-bar" style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: "400px", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        <button
          className="btn"
          onClick={() => handleOpen()}
          style={{ background: "#FF8C42", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          + เพิ่มค่าใช้จ่าย
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>หมวดหมู่</th>
            <th>รายละเอียด</th>
            <th>จำนวนเงิน</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#999" }}>ไม่มีข้อมูล</td></tr>
          ) : (
            filtered.map((item, i) => {
              const realIdx = list.indexOf(item);
              return (
                <tr key={i}>
                  <td>{window.fmtDateGlobal(item.date)}</td>
                  <td>{item.category}</td>
                  <td>{item.description}</td>
                  <td><strong>{parseFloat(item.amount || 0).toLocaleString("th-TH")}</strong></td>
                  <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    <button
                      onClick={() => handleOpen(realIdx)}
                      style={{ background: "none", border: "none", cursor: "pointer", marginRight: "8px" }}
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(realIdx)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                      title="ลบ"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold" }}>รวม:</td>
            <td style={{ fontWeight: "bold", color: "#FF8C42" }}>{total.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editIdx !== null ? "แก้ไขค่าใช้จ่าย" : "เพิ่มค่าใช้จ่ายใหม่"}</h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>วันที่</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>หมวดหมู่</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>อื่นๆ</option>
                  <option>ค่าน้ำ ค่าไฟ</option>
                  <option>ค่าเช่าพื้นที่</option>
                  <option>ค่าแรง</option>
                  <option>ค่าซ่อมแซม</option>
                  <option>ค่ากล่องบรรจุ</option>
                </select>
              </div>

              <div className="form-group">
                <label>รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="บรรยายรายละเอียด..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setOpen(false)} style={{ padding: "8px 16px", border: "1px solid #ddd", background: "white", borderRadius: "4px", cursor: "pointer" }}>
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                style={{ padding: "8px 16px", background: "#FF8C42", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        .modal-head h2 {
          margin: 0;
          font-size: 18px;
        }
        .modal-head button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }
        .modal-body {
          padding: 16px;
        }
        .modal-foot {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding: 16px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

Object.assign(window, { ScreenExpense });
