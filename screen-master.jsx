// 📅 ล็อต & วันหมดอายุ (Lot / Expiry tracking, FEFO)
// อ่านใบรับเข้าจาก localStorage "goods_receipts_list" → แตกเป็นล็อตรายรายการที่มี expireDate
// เรียงแบบ FEFO (หมดอายุก่อน–ใช้ก่อน) พร้อมเตือนของหมดอายุ/ใกล้หมด
const LOT_THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const lotFmtDate = (d) => window.fmtDateGlobal(d);

const ScreenLots = () => {
  const [filter, setFilter] = React.useState("all"); // all | expired | soon | ok
  const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const SOON_DAYS = 30;

  const lots = (() => {
    let list = [];
    try { list = JSON.parse(localStorage.getItem("goods_receipts_list") || "[]"); } catch (e) {}
    const out = [];
    (Array.isArray(list) ? list : []).forEach((rc, ri) => {
      (rc.items || []).forEach((it, ii) => {
        if (!it.expireDate) return;
        const m = String(it.expireDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        let days = null;
        if (m) { const exp = new Date(+m[1], +m[2]-1, +m[3]); exp.setHours(0,0,0,0); days = Math.round((exp - today) / 86400000); }
        out.push({
          key: ri + "-" + ii,
          lot: it.lot || rc.receiptNo || "—",
          code: it.code || "",
          name: it.name || (typeof findRaw === "function" && findRaw(it.code) ? findRaw(it.code).name : it.code) || "—",
          qty: +it.qty || 0,
          unit: it.unit || "",
          supplier: rc.supplierName || "—",
          receiptDate: rc.receiptDate,
          expireDate: it.expireDate,
          days
        });
      });
    });
    out.sort((a, b) => (a.days == null) - (b.days == null) || (a.days - b.days)); // FEFO
    return out;
  })();

  const statusOf = (l) => l.days == null ? "ok" : l.days < 0 ? "expired" : l.days <= SOON_DAYS ? "soon" : "ok";
  const expired = lots.filter(l => statusOf(l) === "expired");
  const soon = lots.filter(l => statusOf(l) === "soon");
  const shown = filter === "all" ? lots : lots.filter(l => statusOf(l) === filter);

  const tone = (s) => s === "expired" ? "var(--brand)" : s === "soon" ? "var(--warn)" : "var(--leaf)";
  const toneSoft = (s) => s === "expired" ? "var(--brand-soft)" : s === "soon" ? "var(--warn-soft)" : "var(--leaf-soft)";
  const label = (l) => { const s = statusOf(l); return s === "expired" ? `หมดอายุแล้ว ${Math.abs(l.days)} วัน` : l.days == null ? "ไม่ระบุ" : `เหลือ ${l.days} วัน`; };

  const FilterBtn = ({ id, txt, n }) => (
    <button onClick={() => setFilter(id)} className={"btn btn-sm" + (filter === id ? " btn-primary" : "")}>{txt}{n != null ? ` (${n})` : ""}</button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">ล็อต & วันหมดอายุ</h1>
          <p className="page-sub">ติดตามล็อตวัตถุดิบจากใบรับเข้า เรียงแบบ FEFO (หมดอายุก่อน–ใช้ก่อน) พร้อมเตือนของใกล้หมดอายุ</p>
        </div>
        <div className="page-actions" style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          <FilterBtn id="all" txt="ทั้งหมด" n={lots.length}/>
          <FilterBtn id="expired" txt="หมดอายุ" n={expired.length}/>
          <FilterBtn id="soon" txt="ใกล้หมด" n={soon.length}/>
          <FilterBtn id="ok" txt="ปกติ"/>
        </div>
      </div>

      <div className="kpi-row" style={{marginBottom:20}}>
        <KPI label="ล็อตที่มีวันหมดอายุ" value={String(lots.length)} unit="ล็อต" hint="จากใบรับเข้า"/>
        <KPI label="หมดอายุแล้ว" value={String(expired.length)} unit="ล็อต" hint={expired.length ? "ควรนำออก / ทำลาย" : "ไม่มี — ดี"}/>
        <KPI label={`ใกล้หมด (≤${SOON_DAYS} วัน)`} value={String(soon.length)} unit="ล็อต" hint={soon.length ? "เร่งใช้ก่อน (FEFO)" : "ไม่มี"}/>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">รายการล็อต</div>
            <div className="card-sub">บันทึกวันหมดอายุได้ในหน้า “ใบรับเข้า (Goods Receipt)”</div>
          </div>
          <div className="badge" style={{background:"var(--surface-sunken)"}}>{shown.length} ล็อต</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>ล็อต / ใบรับ</th><th>วัตถุดิบ</th><th>ผู้ขาย</th>
              <th style={{textAlign:"right"}}>จำนวน</th><th>รับเข้า</th><th>หมดอายุ</th><th style={{textAlign:"center"}}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={7} className="muted" style={{textAlign:"center", padding:28}}>{lots.length === 0 ? "ยังไม่มีล็อตที่ระบุวันหมดอายุ — เพิ่มได้ที่หน้าใบรับเข้า" : "ไม่มีล็อตในกลุ่มนี้"}</td></tr>
            ) : shown.map(l => {
              const s = statusOf(l);
              return (
                <tr key={l.key} style={s === "expired" ? {background:"color-mix(in srgb, var(--brand-soft) 35%, transparent)"} : null}>
                  <td><span className="code">{l.lot}</span></td>
                  <td><div><div className="name" style={{fontWeight:500}}>{l.name}</div>{l.code ? <div className="sku">{l.code}</div> : null}</div></td>
                  <td className="small muted">{l.supplier}</td>
                  <td className="num tnum">{l.qty.toLocaleString()}{l.unit ? " " + l.unit : ""}</td>
                  <td className="small muted">{lotFmtDate(l.receiptDate)}</td>
                  <td className="small" style={{fontWeight: s === "ok" ? 400 : 600, color: tone(s)}}>{lotFmtDate(l.expireDate)}</td>
                  <td style={{textAlign:"center"}}>
                    <span style={{fontSize:11.5, fontWeight:600, padding:"3px 10px", borderRadius:20, color:tone(s), background:toneSoft(s), whiteSpace:"nowrap"}}>{label(l)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="small muted" style={{marginTop:14, lineHeight:1.6}}>
        หมายเหตุ · FEFO = First-Expired-First-Out ใช้ล็อตที่หมดอายุก่อนก่อนเสมอ เพื่อลดของเสีย · ล็อตที่ไม่ได้ระบุวันหมดอายุจะไม่แสดงในหน้านี้
      </div>
    </div>
  );
};

Object.assign(window, { ScreenLots });
