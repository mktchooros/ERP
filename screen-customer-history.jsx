// 💹 ต้นทุน & กำไรขั้นต้น (Costing) — ภาพรวมต้นทุนต่อหน่วยของทุกสินค้าที่มีสูตร
// ต้นทุน = สูตรการผลิต (MOB) × ราคาวัตถุดิบ ; เทียบกับราคาขายเพื่อดูกำไรขั้นต้น
const ScreenCosting = () => {
  const loadArr = (k, seed) => {
    try { const s = localStorage.getItem(k); if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) return p; } } catch (e) {}
    return Array.isArray(seed) ? seed : [];
  };
  const [sortBy, setSortBy] = React.useState("margin"); // margin | code | price

  const rawList = loadArr("erp_raw", typeof RAW !== "undefined" ? RAW : []);
  const recipes = loadArr("erp_recipes", typeof RECIPES !== "undefined" ? RECIPES : []);
  const menu    = typeof loadMenuLive === "function" ? loadMenuLive() : loadArr("erp_menu", typeof MENU !== "undefined" ? MENU : []);
  const rawMap  = React.useMemo(() => Object.fromEntries(rawList.map(r => [r.code, r])), [rawList]);
  const prodMap = React.useMemo(() => Object.fromEntries(menu.map(p => [p.code, p])), [menu]);

  let rows = recipes.filter(rc => rc.product && Array.isArray(rc.items)).map(rc => {
    const cost = rc.items.reduce((s, it) => s + ((rawMap[it.raw]?.cost) || 0) * (+it.qty || 0), 0);
    const makesNum = parseInt(String(rc.makes || "1").replace(/[^\d.]/g, ""), 10) || 1;
    const perUnit = cost / makesNum;
    const p = prodMap[rc.product] || {};
    const price = +p.price || 0;
    const margin = price - perUnit;
    const marginPct = price ? margin / price * 100 : 0;
    return { code: rc.product, recipe: rc.code, name: p.name || rc.name || rc.product, emoji: p.emoji || "📦", unit: p.unit || "หน่วย", perUnit, price, margin, marginPct };
  });

  rows.sort((a, b) =>
    sortBy === "code"  ? String(a.code).localeCompare(String(b.code)) :
    sortBy === "price" ? b.price - a.price :
    a.marginPct - b.marginPct
  );

  const withRecipe = rows.length;
  const noRecipe   = menu.filter(p => !recipes.some(r => r.product === p.code)).length;
  const avgMargin  = rows.length ? rows.reduce((s, r) => s + r.marginPct, 0) / rows.length : 0;
  const lowCount   = rows.filter(r => r.marginPct < 20 && r.margin >= 0).length;
  const lossCount  = rows.filter(r => r.margin < 0).length;

  const tone = (r) => r.margin < 0 ? "var(--brand)" : r.marginPct < 20 ? "var(--warn)" : "var(--leaf)";

  const SortBtn = ({ id, children }) => (
    <button className={"btn btn-sm" + (sortBy === id ? " btn-primary" : "")} onClick={() => setSortBy(id)}>{children}</button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">ต้นทุน & กำไรขั้นต้น</h1>
          <p className="page-sub">ต้นทุนวัตถุดิบต่อหน่วยคำนวณจากสูตรการผลิต (MOB) × ราคาวัตถุดิบ เทียบกับราคาขาย</p>
        </div>
        <div className="page-actions" style={{display:"flex", gap:6, alignItems:"center"}}>
          <span className="small muted" style={{marginRight:4}}>เรียงตาม</span>
          <SortBtn id="margin">กำไรน้อย→มาก</SortBtn>
          <SortBtn id="price">ราคาสูง</SortBtn>
          <SortBtn id="code">รหัส</SortBtn>
        </div>
      </div>

      <div className="kpi-row" style={{marginBottom:20}}>
        <KPI label="สินค้ามีสูตรคำนวณต้นทุน" value={String(withRecipe)} unit="รายการ" hint={noRecipe ? (noRecipe + " รายการยังไม่มีสูตร") : "ครบทุกรายการ"}/>
        <KPI label="กำไรขั้นต้นเฉลี่ย" value={Math.round(avgMargin) + "%"} hint="เฉลี่ยทุกสินค้าที่มีสูตร"/>
        <KPI label="กำไรต่ำกว่า 20%" value={String(lowCount)} unit="รายการ" hint="ควรทบทวนราคา/ต้นทุน"/>
        <KPI label="ขาดทุน (ต้นทุน > ราคา)" value={String(lossCount)} unit="รายการ" hint={lossCount ? "ต้องแก้ด่วน" : "ไม่มี — ดีมาก"}/>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">ตารางต้นทุนต่อหน่วย</div>
            <div className="card-sub">ดูรายละเอียดวัตถุดิบรายตัวได้ที่หน้า “สูตรการผลิต (MOB)”</div>
          </div>
          <div className="badge" style={{background:"var(--surface-sunken)"}}>{withRecipe} สินค้า</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th style={{textAlign:"right"}}>ต้นทุน/หน่วย</th>
              <th style={{textAlign:"right"}}>ราคาขาย</th>
              <th style={{textAlign:"right"}}>กำไร/หน่วย</th>
              <th style={{width:200}}>กำไรขั้นต้น %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="muted" style={{textAlign:"center", padding:28}}>ยังไม่มีสูตรการผลิตที่ผูกกับสินค้า</td></tr>
            ) : rows.map(r => (
              <tr key={r.recipe}>
                <td>
                  <div className="cell-product">
                    <span className="swatch" style={{width:30, height:30, display:"grid", placeItems:"center", borderRadius:8, border:"1px solid var(--border)", fontSize:16}}>{r.emoji}</span>
                    <div>
                      <div className="name">{r.name}</div>
                      <div className="sku">{r.code} · {r.recipe}</div>
                    </div>
                  </div>
                </td>
                <td className="num tnum">{baht(r.perUnit)}</td>
                <td className="num tnum">{baht(r.price)}</td>
                <td className="num tnum" style={{fontWeight:600, color:tone(r)}}>{baht(r.margin)}</td>
                <td>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <div style={{flex:1, height:8, borderRadius:6, background:"var(--surface-sunken)", overflow:"hidden"}}>
                      <div style={{height:"100%", borderRadius:6, width:Math.max(0, Math.min(100, r.marginPct)) + "%", background:tone(r)}}></div>
                    </div>
                    <span style={{fontWeight:700, fontFamily:"var(--font-display)", fontSize:13, color:tone(r), minWidth:44, textAlign:"right"}}>{Math.round(r.marginPct)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="small muted" style={{marginTop:14, lineHeight:1.6}}>
        หมายเหตุ · ต้นทุนนี้คิดเฉพาะ <b>ค่าวัตถุดิบและบรรจุภัณฑ์</b> ตามสูตร ยังไม่รวมค่าแรงและค่าโสหุ้ยการผลิต — กำไรสุทธิจริงจะต่ำกว่านี้
      </div>
    </div>
  );
};

Object.assign(window, { ScreenCosting });
