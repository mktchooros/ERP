// 📊 sales-analytics.jsx — รวบรวม + ปรับรูปข้อมูลการขายจากทุกแหล่ง สำหรับหน้ารายงาน
// ใช้ร่วมกัน: ScreenReportMonth / ScreenReportYear / ScreenReportsSales
(function () {
  const THAI_MONTH = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
    "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
    "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
  };
  const MONTH_TH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const MONTH_FULL = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const DEFAULT_BE = 2569;

  // คืน { beYear, month } หรือ null
  function parseSaleDate(d) {
    if (!d) return null;
    const s = String(d).trim();
    // ISO: 2026-06-13
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) {
      const ce = parseInt(iso[1], 10);
      const be = ce < 2400 ? ce + 543 : ce; // เผื่อบางที่เก็บเป็น พ.ศ.
      return { beYear: be, month: parseInt(iso[2], 10) };
    }
    // ไทย: "18 พ.ค." หรือ "10 มิถุนายน" (+ อาจมีปี 25xx)
    let month = null;
    for (const key in THAI_MONTH) { if (s.indexOf(key) !== -1) { month = THAI_MONTH[key]; break; } }
    if (month) {
      const ym = s.match(/(25\d{2})/);
      const be = ym ? parseInt(ym[1], 10) : DEFAULT_BE;
      return { beYear: be, month };
    }
    return null;
  }

  // รวมรายการขายทั้งหมด → normalized rows
  function gatherAllSales() {
    const out = [];
    let legacy = [];
    try { legacy = JSON.parse(localStorage.getItem("sales") || localStorage.getItem("erp_sales") || "[]") || []; } catch (e) {}
    legacy.forEach((s) => out.push({
      id: s.id || s.invoiceNumber, date: s.date,
      total: parseFloat(s.total) || 0, customerName: s.customerName || "—",
      items: Array.isArray(s.items) ? s.items : [],
      paymentStatus: s.paymentStatus || "unpaid",
      shippingStatus: s.shippingStatus || "order",
      isOrder: false,
    }));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sales_order_")) {
        try {
          const o = JSON.parse(localStorage.getItem(key));
          out.push({
            id: o.orderNumber, date: o.orderDate,
            total: parseFloat(o.totalAmount) || 0, customerName: o.customerName || "—",
            items: Array.isArray(o.items) ? o.items : [],
            paymentStatus: o.paymentStatus || "unpaid",
            shippingStatus: o.shippingStatus || "order",
            isOrder: true,
          });
        } catch (e) {}
      }
    }
    // ไม่มีข้อมูลจริง → ใช้ตัวอย่างจาก SALES เพื่อไม่ให้รายงานว่าง
    if (out.length === 0 && typeof SALES !== "undefined") {
      SALES.forEach((s) => out.push({
        id: s.id, date: s.date, total: parseFloat(s.total) || 0,
        customerName: s.customerName || s.customer || "—",
        items: Array.isArray(s.items) ? s.items : [],
        paymentStatus: s.paymentStatus || "paid",
        shippingStatus: s.shippingStatus || "delivered",
        isOrder: false,
      }));
    }
    return out;
  }

  window.salesAnalytics = { parseSaleDate, gatherAllSales, MONTH_TH, MONTH_FULL };
})();
