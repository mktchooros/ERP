// 📋 รายงานบันทึกการผลิต — สรุปล็อตการผลิตทั้งหมด ค้นหา/กรอง/พิมพ์ได้
const ScreenReportProduction = () => {
  // ── อ่านข้อมูลล่าสุด ──
  const prods = (() => { try { const s = localStorage.getItem('erp_productions'); if (s) return JSON.parse(s); } catch (e) {} return (typeof PRODUCTIONS !== 'undefined') ? PRODUCTIONS : []; })();
  const recipes = (() => { try { const s = localStorage.getItem('erp_recipes'); if (s) return JSON.parse(s); } catch (e) {} return (typeof RECIPES !== 'undefined') ? RECIPES : []; })();
  const products = (typeof MENU !== 'undefined') ? MENU : ((typeof PRODUCTS !== 'undefined') ? PRODUCTS : []);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all"); // all | done | pending
  const [byFilter, setByFilter] = React.useState("all");

  const recipeName = (code) => recipes.find(r => r.code === code)?.name || "—";
  const productName = (code) => products.find(p => p.code === code)?.name || "";

  // จัดรูปแบบวันที่ให้เป็นรูปแบบเดียวกัน: "20 มิ.ย. 2569" (รองรับทั้ง ISO และไทย)
  const MONTH_TH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const TH_MONTH_MAP = { "ม.ค.":1,"ก.พ.":2,"มี.ค.":3,"เม.ย.":4,"พ.ค.":5,"มิ.ย.":6,"ก.ค.":7,"ส.ค.":8,"ก.ย.":9,"ต.ค.":10,"พ.ย.":11,"ธ.ค.":12,
    "มกราคม":1,"กุมภาพันธ์":2,"มีนาคม":3,"เมษายน":4,"พฤษภาคม":5,"มิถุนายน":6,"กรกฎาคม":7,"สิงหาคม":8,"กันยายน":9,"ตุลาคม":10,"พฤศจิกายน":11,"ธันวาคม":12 };
  const fmtDate = (d) => window.fmtDateGlobal(d);

  // สถานะมาตรฐาน: done | pending
  const normStatus = (s) => {
    const t = String(s || "").trim().toLowerCase();
    if (t === "done" || t === "เสร็จแล้ว" || t === "เสร็จ") return "done";
    return "pending";
  };
  const statusLabel = (s) => normStatus(s) === "done" ? "เสร็จแล้ว" : "รอผลิต";

  // ── รายชื่อผู้ผลิตสำหรับ filter ──
  const people = Array.from(new Set(prods.map(p => p.by).filter(Boolean)));

  // ── กรอง ──
  const rows = prods.filter(p => {
    if (statusFilter !== "all" && normStatus(p.status) !== statusFilter) return false;
    if (byFilter !== "all" && p.by !== byFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${p.code} ${p.recipe} ${recipeName(p.recipe)} ${p.product} ${productName(p.product)} ${p.by}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // ── สรุป ──
  const num = (n) => Number(n || 0).toLocaleString();
  const totalOrdered = rows.reduce((s, p) => s + (parseFloat(p.qty) || 0), 0);
  const totalActual = rows.reduce((s, p) => s + (parseFloat(p.actualQty) || parseFloat(p.qty) || 0), 0);
  const doneCount = rows.filter(p => normStatus(p.status) === "done").length;
  const pendingCount = rows.length - doneCount;
  const yieldPct = totalOrdered > 0 ? Math.round(totalActual / totalOrdered * 100) : 0;

  const rowYield = (p) => {
    const ordered = parseFloat(p.qty) || 0;
    const actual = parseFloat(p.actualQty) || ordered;
    if (!ordered) return null;
    return Math.round(actual / ordered * 100);
  };

  // ── พิมพ์รายงาน ──
  const printReport = () => {
    const logoUrl = (() => { try { return new URL("logo.jpg", window.location.href).href; } catch (e) { return "logo.jpg"; } })();
    const bodyRows = rows.map((p, i) => {
      const yld = rowYield(p);
      return `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${fmtDate(p.date)}</td>
        <td>${p.code || ''}</td>
        <td>${p.recipe || ''} · ${recipeName(p.recipe)}</td>
        <td>${productName(p.product) || p.product || '—'}</td>
        <td style="text-align:right">${num(p.qty)}</td>
        <td style="text-align:right">${num(p.actualQty || p.qty)}</td>
        <td style="text-align:center">${yld == null ? '—' : yld + '%'}</td>
        <td>${p.by || ''}</td>
        <td style="text-align:center">${statusLabel(p.status)}</td>
      </tr>`;
    }).join("");
    const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"/>
    <title>รายงานบันทึกการผลิต</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap');
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'IBM Plex Sans Thai',sans-serif; color:#1F1B18; padding:24px; background:#EDE7DE; }
      .doc { width:1060px; max-width:100%; margin:0 auto; background:#fff; border:2px solid #C75F12; padding:18px 22px 26px; }
      .head { display:flex; align-items:center; gap:14px; border-bottom:2px solid #555; padding-bottom:10px; }
      .head .logo { width:64px; height:64px; flex:0 0 64px; object-fit:contain; border-radius:6px; }
      .head .titles { flex:1; text-align:center; }
      .head .company { font-size:19px; font-weight:700; }
      .head .form-title { font-size:23px; font-weight:700; margin-top:5px; }
      .meta { display:flex; gap:22px; flex-wrap:wrap; margin:12px 2px 4px; font-size:13px; font-weight:600; }
      .meta b { font-weight:700; }
      table { width:100%; border-collapse:collapse; margin-top:12px; table-layout:fixed; }
      th, td { border:1px solid #555; padding:6px 6px; font-size:11.5px; vertical-align:middle; }
      thead th { background:#FBE3CF; font-weight:700; text-align:center; line-height:1.25; }
      tbody td { height:26px; }
      tfoot td { background:#F6EFE6; font-weight:700; }
      .foot { margin-top:14px; text-align:right; font-size:10px; color:#999; }
      .bar { text-align:center; margin-top:20px; }
      .btn { font-family:inherit; font-size:14px; font-weight:600; padding:10px 26px; border-radius:8px; border:none; cursor:pointer; background:#C75F12; color:#fff; }
      @media print { body { background:#fff; padding:0; } .doc { border:none; width:auto; } .no-print { display:none !important; } }
    </style></head><body>
    <div class="doc">
      <div class="head">
        <img class="logo" src="${logoUrl}" alt="ยายปู" onerror="this.style.display='none'"/>
        <div class="titles">
          <div class="company">บริษัท ชูรสยายปู จำกัด</div>
          <div class="form-title">รายงานบันทึกการผลิต</div>
        </div>
        <div style="width:64px;flex:0 0 64px"></div>
      </div>
      <div class="meta">
        <span>จำนวนล็อต: <b>${num(rows.length)}</b> ล็อต</span>
        <span>สั่งผลิตรวม: <b>${num(totalOrdered)}</b></span>
        <span>ผลิตจริงรวม: <b>${num(totalActual)}</b></span>
        <span>เสร็จแล้ว: <b>${num(doneCount)}</b> · รอผลิต: <b>${num(pendingCount)}</b></span>
        <span style="margin-left:auto">พิมพ์เมื่อ ${window.fmtDateGlobal(new Date().toISOString().slice(0,10))}</span>
      </div>
      <table>
        <colgroup>
          <col style="width:4%"/><col style="width:9%"/><col style="width:10%"/><col style="width:26%"/>
          <col style="width:17%"/><col style="width:8%"/><col style="width:8%"/><col style="width:6%"/>
          <col style="width:8%"/><col style="width:9%"/>
        </colgroup>
        <thead><tr>
          <th>ลำดับ</th><th>วันที่</th><th>เลขที่ใบสั่งผลิต</th><th>สูตรที่ใช้</th><th>สินค้าที่ผลิต</th>
          <th>สั่งผลิต</th><th>ผลิตจริง</th><th>%</th><th>ผู้ผลิต</th><th>สถานะ</th>
        </tr></thead>
        <tbody>${bodyRows || `<tr><td colspan="10" style="text-align:center;color:#999;height:40px">ไม่มีข้อมูล</td></tr>`}</tbody>
        <tfoot><tr>
          <td colspan="5" style="text-align:right">รวม</td>
          <td style="text-align:right">${num(totalOrdered)}</td>
          <td style="text-align:right">${num(totalActual)}</td>
          <td style="text-align:center">${yieldPct}%</td>
          <td colspan="2"></td>
        </tr></tfoot>
      </table>
      <div class="foot">ระบบ ERP ยายปู · พิมพ์เมื่อ ${new Date().toLocaleString("th-TH")}</div>
    </div>
    <div class="bar no-print"><button class="btn" onclick="window.print()">🖨️ พิมพ์รายงานนี้</button></div>
    </body></html>`;
    const win = window.open("", "_blank", "width=1140,height=820");
    if (!win) { alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์"); return; }
    win.document.write(html); win.document.close();
  };

  // ── ส่งออก CSV ──
  const exportCSV = () => {
    const header = ["ลำดับ", "วันที่", "เลขที่ใบสั่งผลิต", "รหัสสูตร", "ชื่อสูตร", "สินค้าที่ผลิต", "สั่งผลิต", "ผลิตจริง", "ยอดได้(%)", "ผู้ผลิต", "สถานะ"];
    const lines = [header.join(",")];
    rows.forEach((p, i) => {
      const yld = rowYield(p);
      const cells = [i + 1, fmtDate(p.date), p.code || "", p.recipe || "", recipeName(p.recipe), productName(p.product) || p.product || "", parseFloat(p.qty) || 0, parseFloat(p.actualQty) || parseFloat(p.qty) || 0, yld == null ? "" : yld, p.by || "", statusLabel(p.status)];
      lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `รายงานการผลิต_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">📋 รายงานบันทึกการผลิต</h1>
          <p className="page-sub">สรุปล็อตการผลิตทั้งหมด · {prods.length} ล็อต</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportCSV}><Icon name="download" size={14}/> ส่งออก CSV</button>
          <button className="btn btn-primary" onClick={printReport}><Icon name="receipt" size={14}/> พิมพ์รายงาน</button>
        </div>
      </div>

      <div className="kpi-row" style={{marginBottom:14, gridTemplateColumns:"repeat(4, 1fr)"}}>
        <KPI label="จำนวนล็อต" value={num(rows.length)} unit="ล็อต" hint={`จากทั้งหมด ${num(prods.length)} ล็อต`}/>
        <KPI label="สั่งผลิตรวม" value={num(totalOrdered)} hint="ตามจำนวนที่สั่ง"/>
        <KPI label="ผลิตจริงรวม" value={num(totalActual)} hint={`ยอดได้เฉลี่ย ${yieldPct}%`}/>
        <KPI label="สถานะ" value={num(doneCount)} unit="เสร็จ" hint={`รอผลิต ${num(pendingCount)} ล็อต`}/>
      </div>

      <div className="card">
        <div className="card-head" style={{flexWrap:"wrap", gap:10}}>
          <h3 className="card-title">รายการบันทึกการผลิต</h3>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
            <div className="search" style={{margin:0, minWidth:220}}>
              <Icon name="search" size={14}/>
              <input placeholder="ค้นหา PD / สูตร / สินค้า / ผู้ผลิต…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className="form-input" style={{width:"auto"}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">ทุกสถานะ</option>
              <option value="done">เสร็จแล้ว</option>
              <option value="pending">รอผลิต</option>
            </select>
            <select className="form-input" style={{width:"auto"}} value={byFilter} onChange={e => setByFilter(e.target.value)}>
              <option value="all">ผู้ผลิตทั้งหมด</option>
              {people.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:"4%"}}>#</th>
              <th>วันที่</th>
              <th>เลขที่ใบสั่งผลิต</th>
              <th>สูตรที่ใช้</th>
              <th>สินค้าที่ผลิต</th>
              <th className="num">สั่งผลิต</th>
              <th className="num">ผลิตจริง</th>
              <th className="num">ยอดได้</th>
              <th>ผู้ผลิต</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} style={{textAlign:"center", color:"var(--muted)", padding:"24px"}}>ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
            ) : rows.map((p, i) => {
              const yld = rowYield(p);
              const done = normStatus(p.status) === "done";
              return (
                <tr key={p.code + "_" + i}>
                  <td className="muted">{i + 1}</td>
                  <td>{fmtDate(p.date)}</td>
                  <td style={{fontWeight:600}}>{p.code}</td>
                  <td>
                    <span style={{fontWeight:600}}>{p.recipe}</span>
                    <span className="muted small" style={{marginLeft:6}}>{recipeName(p.recipe)}</span>
                  </td>
                  <td>{productName(p.product) || p.product || "—"}</td>
                  <td className="num tnum">{num(p.qty)}</td>
                  <td className="num tnum" style={{fontWeight:600}}>{num(p.actualQty || p.qty)}</td>
                  <td className="num tnum" style={{color: yld != null && yld < 100 ? "var(--brand)" : yld != null && yld > 100 ? "#2D7D46" : "var(--muted)"}}>
                    {yld == null ? "—" : yld + "%"}
                  </td>
                  <td className="small muted">{p.by || "—"}</td>
                  <td><Badge kind={done ? "done" : "wait"}>{statusLabel(p.status)}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenReportProduction });
