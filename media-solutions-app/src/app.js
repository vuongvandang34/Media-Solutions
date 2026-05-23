const { useEffect, useMemo, useState } = React;
const { createRoot } = ReactDOM;
const h = React.createElement;
const money = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " VND";
const now = () => new Date().toLocaleString("sv-SE", { hour12: false }).slice(0, 16);
const id = () => Math.random().toString(36).slice(2, 10);

const clientMenu = {
  overview: { label: "Tổng quan", desc: "Sức khỏe vận hành" },
  1: { label: "Đăng ký doanh nghiệp", desc: "Thiết lập hồ sơ & OTP" },
  2: { label: "Bảo mật tài khoản", desc: "2FA, brute-force, audit" },
  3: { label: "Quên mật khẩu", desc: "Phục hồi quyền truy cập" },
  4: { label: "Thương hiệu", desc: "Logo & hình ảnh" },
  5: { label: "Nhân sự", desc: "Quản lý staff" },
  6: { label: "Khách hàng", desc: "Customer 360" },
  7: { label: "Khảo sát", desc: "Survey builder" },
  8: { label: "Lịch sử khảo sát", desc: "Phản hồi & phân tích" },
  9: { label: "Ngôn ngữ", desc: "Localization" },
  10: { label: "Màn hình khách hàng", desc: "Customer-facing UI" },
};

const adminMenu = {
  overview: { label: "Tổng quan", desc: "Founder dashboard" },
  11: { label: "Super Admin", desc: "Doanh nghiệp, MRR, hỗ trợ" },
};

function moduleTitle(text) {
  return String(text || "").replace(/^MODULE:\s*/i, "").replace(/\.$/, "");
}

function flattenTree(node) {
  return [node, ...(node.children || []).flatMap(flattenTree)];
}

function App() {
  const [workbook, setWorkbook] = useState(null);
  const [data, setData] = useState(null);
  const [workspace, setWorkspace] = useState("client");
  const [moduleCode, setModuleCode] = useState("overview");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [filters, setFilters] = useState({ staff: "", customers: "", responses: "" });

  useEffect(() => {
    Promise.all([fetch("/api/workbook").then((r) => r.json()), fetch("/api/state").then((r) => r.json())]).then(([wb, state]) => {
      setWorkbook(wb);
      setData(state);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  }, [data]);

  const sheets = workbook?.sheets || [];
  const adminSheet = sheets[0];
  const clientSheet = sheets[1];
  const moduleSheet = sheets[3];

  const modules = useMemo(() => {
    const overview = { id: workspace + "-overview", code: "overview", title: "Tổng quan", children: [] };
    if (workspace === "admin") return [overview, ...(adminSheet?.roots || [])];
    const indexModules = moduleSheet?.flat || [];
    return [overview, ...indexModules.map((item) => {
      const detail = clientSheet?.roots?.find((root) => root.code === item.code || root.code === String(Number(item.code))) || item;
      return { ...detail, indexTitle: item.title };
    })];
  }, [workspace, adminSheet, clientSheet, moduleSheet]);

  const activeModule = modules.find((m) => rootCode(m.code) === moduleCode) || modules[0];
  const activeMenu = getMenu(workspace, moduleCode);

  if (!workbook || !data) {
    return h("main", { className: "loading" }, h("div", null, h("strong", null, "Media Solutions CRM"), h("span", null, "Đang tải ứng dụng...")));
  }

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updateData = (fn, message) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    if (message) notify(message);
  };

  const reset = async () => {
    const fresh = await fetch("/api/reset", { method: "POST" }).then((r) => r.json());
    setData(fresh);
    notify("Đã reset dữ liệu demo.");
  };

  return h(
    "div",
    { className: "app" },
    h(Sidebar, {
      workspace,
      setWorkspace: (next) => {
        setWorkspace(next);
        setModuleCode("overview");
      },
      query,
      setQuery,
      modules,
      activeCode: moduleCode,
      setModuleCode,
      reset,
    }),
    h(
      "main",
      { className: "main" },
      h(Topbar, { workspace, activeMenu }),
      h(Metrics, { data, workspace }),
      h(
        "section",
        { className: "work-grid full" },
        h(ModuleWorkspace, {
          data,
          updateData,
          workspace,
          moduleCode,
          activeModule,
          filters,
          setFilters,
          notify,
        }),
      ),
    ),
    toast && h("div", { className: "toast" }, toast),
  );
}

function Sidebar({ workspace, setWorkspace, query, setQuery, modules, activeCode, setModuleCode, reset }) {
  const visible = modules.filter((m) => getMenu(workspace, rootCode(m.code)).label.toLowerCase().includes(query.toLowerCase()));
  return h(
    "aside",
    { className: "sidebar" },
    h("div", { className: "brand" }, h("div", { className: "brand-mark" }, "MS"), h("div", null, h("strong", null, "Media Solutions"), h("span", null, "Customer Experience Platform"))),
    h("div", { className: "switcher" }, h("button", { className: workspace === "client" ? "active" : "", onClick: () => setWorkspace("client") }, "Client CRM"), h("button", { className: workspace === "admin" ? "active" : "", onClick: () => setWorkspace("admin") }, "Super Admin")),
    h("label", { className: "search" }, h("span", null, "Tìm chức năng"), h("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Khảo sát, nhân sự, khách hàng..." })),
    h(
      "nav",
      { className: "nav-list" },
      visible.map((m) => {
        const menu = getMenu(workspace, rootCode(m.code));
        return h(
          "button",
          { key: m.id || m.code, className: rootCode(m.code) === activeCode ? "nav-item active" : "nav-item", onClick: () => setModuleCode(rootCode(m.code)) },
          h("span", null, menuIcon(rootCode(m.code), workspace)),
          h("strong", null, menu.label),
          h("small", null, menu.desc),
        );
      }),
    ),
    h("button", { className: "danger-soft", onClick: reset }, "Reset dữ liệu demo"),
  );
}

function Topbar({ workspace, activeMenu }) {
  return h(
    "header",
    { className: "topbar" },
    h("div", null, h("p", null, workspace === "admin" ? "Founder Operation Center" : "Customer Experience CRM"), h("h1", null, activeMenu.label), h("span", { className: "top-subtitle" }, activeMenu.desc)),
    h("div", { className: "top-actions" }, h("button", { onClick: () => window.print() }, "In báo cáo"), h("button", { onClick: () => location.reload() }, "Làm mới")),
  );
}

function Metrics({ data, workspace }) {
  const avg = data.responses.length ? data.responses.reduce((s, r) => s + Number(r.score), 0) / data.responses.length : 0;
  const metrics =
    workspace === "admin"
      ? [
          ["Doanh nghiệp", data.businesses.length, "Tổng tenant"],
          ["Active", data.businesses.filter((b) => b.status === "Active").length, "Đang hoạt động"],
          ["MRR", money(data.businesses.reduce((s, b) => s + Number(b.mrr), 0)), "Doanh thu tháng"],
          ["Ticket", data.tickets.length, "Cần xử lý"],
        ]
      : [
          ["Nhân sự", data.staff.length, "Phân quyền vận hành"],
          ["Khách hàng", data.customers.length, "Customer 360"],
          ["Khảo sát", data.responses.length, "Phản hồi đã ghi nhận"],
          ["CSAT", avg.toFixed(1), "Điểm trung bình"],
        ];
  return h("section", { className: "metrics" }, metrics.map(([label, value, sub]) => h("article", { key: label }, h("span", null, label), h("strong", null, value), h("small", null, sub))));
}

function ModuleWorkspace(props) {
  if (props.moduleCode === "overview") return h(Overview, props);
  if (props.workspace === "admin") return h(AdminModule, props);
  const views = {
    1: Registration,
    2: Security,
    3: Recovery,
    4: MediaAssets,
    5: Staff,
    6: Customers,
    7: SurveyBuilder,
    8: SurveyHistory,
    9: Settings,
    10: CustomerDisplay,
  };
  const View = views[props.moduleCode] || Registration;
  return h("div", { className: "workspace" }, h(View, props));
}

function Overview({ data, workspace, updateData }) {
  if (workspace === "admin") {
    const mrr = data.businesses.reduce((s, b) => s + Number(b.mrr), 0);
    return h(
      "div",
      { className: "workspace" },
      h(
        "section",
        { className: "hero-panel" },
        h("div", null, h("span", null, "Founder command center"), h("h2", null, "Theo dõi doanh nghiệp, doanh thu và rủi ro trên một màn hình"), h("p", null, "Tập trung các chỉ số vận hành quan trọng để ưu tiên hỗ trợ và tăng trưởng.")),
        h("button", { onClick: () => updateData((d) => d.tickets.unshift({ id: id(), business: d.businesses[0].name, issue: "Kiểm tra tài khoản rủi ro", priority: "High", status: "Open" }), "Đã tạo ticket ưu tiên.") }, "Tạo ticket ưu tiên"),
      ),
      h("div", { className: "insight-grid" }, h(InsightCard, { label: "MRR", value: money(mrr), note: "Doanh thu định kỳ hiện tại" }), h(InsightCard, { label: "At-risk", value: data.businesses.filter((b) => b.risk === "High").length, note: "Cần CS xử lý" }), h(InsightCard, { label: "SLA", value: "92%", note: "Ticket đúng hạn" })),
      h(DataTable, { title: "Tài khoản cần chú ý", headers: ["Doanh nghiệp", "Gói", "Trạng thái", "MRR", "Rủi ro"], rows: data.businesses.map((b) => [b.name, b.plan, badge(b.status), money(b.mrr), badge(b.risk)]) }),
    );
  }

  const weak = data.customers.filter((c) => Number(c.score) < 7);
  return h(
    "div",
    { className: "workspace" },
    h(
      "section",
      { className: "hero-panel" },
      h("div", null, h("span", null, "Customer experience workspace"), h("h2", null, `Chào ${data.company.owner || "bạn"}, hôm nay có ${weak.length} khách hàng cần chăm sóc`), h("p", null, "Quản lý nhân sự, khách hàng, khảo sát và màn hình đánh giá trong cùng một nơi.")),
      h("button", { onClick: () => updateData((d) => d.responses.unshift({ id: id(), customer: d.company.name, channel: "Quick action", score: 9, note: "Quick demo", createdAt: now() }), "Đã thêm phản hồi nhanh.") }, "Ghi nhận phản hồi"),
    ),
    h("div", { className: "insight-grid" }, h(InsightCard, { label: "CSAT", value: averageScore(data.responses), note: "Điểm trung bình" }), h(InsightCard, { label: "Callback", value: weak.length, note: "Khách hàng dưới 7 điểm" }), h(InsightCard, { label: "Published", value: data.survey.published ? "On" : "Off", note: data.survey.title })),
    h(
      "div",
      { className: "dashboard-split" },
      h(DataTable, { title: "Khách hàng cần chăm sóc", headers: ["Khách hàng", "SĐT", "Điểm", "Trạng thái", "Phụ trách"], rows: data.customers.map((c) => [c.name, c.phone, c.score, badge(c.status), c.owner]) }),
      h("section", { className: "panel next-actions" }, h("div", { className: "panel-title" }, h("span", null, "Việc nên làm"), h("h2", null, "Ưu tiên hôm nay")), ["Gọi lại khách hàng dưới 7 điểm", "Kiểm tra survey đang publish", "Mời nhân sự Pending kích hoạt", "Cập nhật hình ảnh thương hiệu"].map((x) => h("label", { key: x }, h("input", { type: "checkbox" }), h("span", null, x)))),
    ),
  );
}

function InsightCard({ label, value, note }) {
  return h("article", { className: "insight-card" }, h("span", null, label), h("strong", null, value), h("small", null, note));
}

function Registration({ data, updateData }) {
  const [form, setForm] = useState({ ...data.company, password: "" });
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!validPassword(form.password)) return setError("Mật khẩu phải bắt đầu bằng chữ hoa, có chữ thường, số, ký tự đặc biệt và tối đa 16 ký tự.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Email chưa đúng định dạng.");
    if (digits(form.phone).length < 8 || digits(form.phone).length > 14) return setError("Số điện thoại cần từ 8 đến 14 chữ số bao gồm mã vùng.");
    updateData((d) => {
      d.company = { ...d.company, ...form, password: undefined, status: "Pending OTP" };
      d.security.otp = String(Math.floor(100000 + Math.random() * 900000));
      d.audit.unshift(audit("Gửi OTP kích hoạt", d.company.email, "Thành công"));
    }, "Đã lưu hồ sơ và gửi OTP mô phỏng.");
    setError("");
  };
  return h(Panel, { title: "Thiết lập profile doanh nghiệp", kicker: "Module 1" }, h(FormGrid, { form, setForm, submit, error }, [
    input("Tên doanh nghiệp", "name", true),
    input("Địa chỉ", "address", true),
    select("Quốc gia", "country", ["Việt Nam", "Singapore", "United States"]),
    input("Họ và tên", "owner", true),
    input("Email", "email", true, "email"),
    input("Số điện thoại", "phone", true),
    input("Mật khẩu", "password", true, "password"),
  ]));
}

function Security({ data, updateData }) {
  const s = data.security;
  return h(
    "div",
    null,
    h(
      Panel,
      { title: "Xác thực & chống brute-force", kicker: "Module 2" },
      h("div", { className: "control-grid" },
        h(Toggle, { label: "Xác thực 2 lớp", checked: s.twoFactor, onChange: (checked) => updateData((d) => (d.security.twoFactor = checked), "Đã cập nhật 2FA.") }),
        h(NumberControl, { label: "Số lần sai tối đa", value: s.maxAttempts, onChange: (v) => updateData((d) => (d.security.maxAttempts = v)) }),
        h(NumberControl, { label: "Khóa tạm thời (phút)", value: s.lockMinutes, onChange: (v) => updateData((d) => (d.security.lockMinutes = v)) }),
        h("button", { onClick: () => updateData((d) => { d.security.loginFailures += 1; d.audit.unshift(audit("Đăng nhập sai", d.company.email, d.security.loginFailures >= d.security.maxAttempts ? "Khóa tạm" : "Cảnh báo")); }, "Đã ghi nhận đăng nhập sai.") }, "Giả lập sai mật khẩu"),
      ),
    ),
    h(DataTable, { title: "Audit log", headers: ["Thời gian", "Sự kiện", "Tác nhân", "Kết quả"], rows: data.audit.map((a) => [a.time, a.event, a.actor, badge(a.result)]) }),
  );
}

function Recovery({ data, updateData }) {
  const [form, setForm] = useState({ email: data.company.email, code: "", password: "" });
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (form.code.length < 6 || !validPassword(form.password)) return setError("Mã xác minh cần 6 ký tự và mật khẩu mới phải đúng rule.");
    updateData((d) => d.audit.unshift(audit("Phục hồi mật khẩu", form.email, "Thành công")), "Đã gửi link phục hồi quyền truy cập.");
  };
  return h(Panel, { title: "Tự phục hồi quyền truy cập", kicker: "Module 3" }, h(FormGrid, { form, setForm, submit, error }, [input("Email", "email", true, "email"), input("Mã xác minh", "code", true), input("Mật khẩu mới", "password", true, "password")]));
}

function MediaAssets({ data, updateData }) {
  const upload = (key, file) => {
    const reader = new FileReader();
    reader.onload = () => updateData((d) => (d.company[key] = reader.result), "Đã cập nhật hình ảnh.");
    reader.readAsDataURL(file);
  };
  return h(
    Panel,
    { title: "Logo & hình ảnh khuyến mãi", kicker: "Module 4" },
    h("div", { className: "asset-grid" },
      h(AssetBox, { title: "Logo", image: data.company.logo, fallback: "MS", onFile: (file) => upload("logo", file) }),
      h(AssetBox, { title: "Promotion Photo", image: data.company.promotion, onFile: (file) => upload("promotion", file) }),
    ),
  );
}

function Staff({ data, updateData, filters, setFilters }) {
  return h(CrudTable, {
    title: "Nhân sự",
    kicker: "Module 5",
    filter: filters.staff,
    setFilter: (v) => setFilters((f) => ({ ...f, staff: v })),
    fields: [
      ["name", "Họ tên"],
      ["role", "Vai trò"],
      ["email", "Email"],
      ["phone", "SĐT"],
    ],
    rows: data.staff,
    columns: ["name", "role", "email", "phone", "status"],
    add: (item) => updateData((d) => d.staff.unshift({ id: id(), ...item, status: "Pending" }), "Đã thêm nhân sự."),
    remove: (rowId) => updateData((d) => (d.staff = d.staff.filter((x) => x.id !== rowId)), "Đã xóa nhân sự."),
  });
}

function Customers({ data, updateData, filters, setFilters }) {
  return h(CrudTable, {
    title: "Khách hàng",
    kicker: "Module 6",
    filter: filters.customers,
    setFilter: (v) => setFilters((f) => ({ ...f, customers: v })),
    fields: [
      ["name", "Tên khách hàng"],
      ["segment", "Phân khúc"],
      ["phone", "SĐT"],
      ["score", "CSAT"],
      ["owner", "Phụ trách"],
    ],
    rows: data.customers,
    columns: ["name", "segment", "phone", "score", "status", "owner"],
    add: (item) => updateData((d) => d.customers.unshift({ id: id(), ...item, score: Number(item.score), status: Number(item.score) < 7 ? "Callback" : "Watch" }), "Đã thêm khách hàng."),
    remove: (rowId) => updateData((d) => (d.customers = d.customers.filter((x) => x.id !== rowId)), "Đã xóa khách hàng."),
  });
}

function SurveyBuilder({ data, updateData }) {
  const [text, setText] = useState("");
  return h(
    Panel,
    { title: "Quản lý khảo sát", kicker: "Module 7" },
    h("div", { className: "survey-head" }, h("input", { value: data.survey.title, onChange: (e) => updateData((d) => (d.survey.title = e.target.value)) }), h("button", { onClick: () => updateData((d) => (d.survey.published = !d.survey.published), data.survey.published ? "Đã tắt publish." : "Đã publish khảo sát.") }, data.survey.published ? "Unpublish" : "Publish")),
    h("div", { className: "add-line" }, h("input", { value: text, onChange: (e) => setText(e.target.value), placeholder: "Nhập câu hỏi mới..." }), h("button", { onClick: () => text && updateData((d) => { d.survey.questions.push({ id: id(), text, type: "rating", required: true }); setText(""); }, "Đã thêm câu hỏi.") }, "Thêm")),
    h("div", { className: "question-list" }, data.survey.questions.map((q, index) => h("article", { key: q.id }, h("span", null, index + 1), h("strong", null, q.text), h("small", null, q.type), h("button", { onClick: () => updateData((d) => (d.survey.questions = d.survey.questions.filter((x) => x.id !== q.id)), "Đã xóa câu hỏi.") }, "Xóa")))),
  );
}

function SurveyHistory({ data, updateData, filters, setFilters }) {
  return h(CrudTable, {
    title: "Lịch sử khảo sát",
    kicker: "Module 8",
    filter: filters.responses,
    setFilter: (v) => setFilters((f) => ({ ...f, responses: v })),
    fields: [
      ["customer", "Khách hàng"],
      ["channel", "Kênh"],
      ["score", "Điểm"],
      ["note", "Ghi chú"],
    ],
    rows: data.responses,
    columns: ["createdAt", "customer", "channel", "score", "note"],
    add: (item) => updateData((d) => d.responses.unshift({ id: id(), ...item, score: Number(item.score), createdAt: now() }), "Đã ghi nhận phản hồi."),
    remove: (rowId) => updateData((d) => (d.responses = d.responses.filter((x) => x.id !== rowId)), "Đã xóa phản hồi."),
  });
}

function Settings({ data, updateData }) {
  const [form, setForm] = useState(data.settings);
  return h(Panel, { title: "Ngôn ngữ & bản địa hóa", kicker: "Module 9" }, h(FormGrid, { form, setForm, submit: (e) => { e.preventDefault(); updateData((d) => (d.settings = form), "Đã lưu cấu hình."); } }, [select("Ngôn ngữ", "language", ["Tiếng Việt", "English"]), select("Tiền tệ", "currency", ["VND", "USD"]), select("Múi giờ", "timezone", ["Asia/Saigon", "UTC"]), select("Định dạng ngày", "dateFormat", ["DD/MM/YYYY", "YYYY-MM-DD"])]));
}

function CustomerDisplay({ data, updateData }) {
  return h(
    Panel,
    { title: "Màn hình thao tác của khách hàng", kicker: "Module 10" },
    h(
      "div",
      { className: "phone-stage" },
      h(
        "div",
        { className: "phone" },
        data.company.logo ? h("img", { src: data.company.logo, className: "phone-logo" }) : h("div", { className: "phone-logo mark" }, "MS"),
        data.company.promotion && h("img", { src: data.company.promotion, className: "phone-promo" }),
        h("h3", null, data.survey.title),
        data.survey.questions.slice(0, 2).map((q) =>
          h("div", { key: q.id, className: "phone-question" }, h("strong", null, q.text), h("div", null, [1, 2, 3, 4, 5].map((n) => h("button", { key: n }, n)))),
        ),
        h(
          "button",
          {
            className: "full-btn",
            onClick: () => updateData((d) => d.responses.unshift({ id: id(), customer: d.company.name, channel: "Customer UI", score: 9, note: "Demo submit", createdAt: now() }), "Đã gửi phản hồi demo."),
          },
          "Gửi đánh giá",
        ),
      ),
    ),
  );
}

function AdminModule({ data, updateData }) {
  return h(
    "div",
    { className: "workspace" },
    h(Panel, { title: "Quản lý & hỗ trợ doanh nghiệp", kicker: "Module 11" }, h("div", { className: "ops-grid" }, h("div", null, h("strong", null, "API response"), h("span", null, "148ms")), h("div", null, h("strong", null, "Bot health"), h("span", null, "99.96%")), h("div", null, h("strong", null, "At-risk"), h("span", null, data.businesses.filter((b) => b.risk === "High").length)))),
    h(DataTable, { title: "Doanh nghiệp khách hàng", headers: ["Tên", "Gói", "Trạng thái", "MRR", "Hoạt động", "Rủi ro"], rows: data.businesses.map((b) => [b.name, b.plan, badge(b.status), money(b.mrr), b.lastSeen, badge(b.risk)]) }),
    h(TicketBox, { data, updateData }),
  );
}

function TicketBox({ data, updateData }) {
  const [issue, setIssue] = useState("");
  return h(Panel, { title: "Ticket hỗ trợ", kicker: "SLA" }, h("div", { className: "add-line" }, h("input", { value: issue, onChange: (e) => setIssue(e.target.value), placeholder: "Nhập vấn đề cần hỗ trợ..." }), h("button", { onClick: () => issue && updateData((d) => { d.tickets.unshift({ id: id(), business: d.businesses[0].name, issue, priority: "Medium", status: "Open" }); setIssue(""); }, "Đã tạo ticket.") }, "Tạo ticket")), h(DataTable, { compact: true, headers: ["Doanh nghiệp", "Vấn đề", "Ưu tiên", "Trạng thái"], rows: data.tickets.map((t) => [t.business, t.issue, badge(t.priority), badge(t.status)]) }));
}

function Panel({ kicker, title, children }) {
  return h("section", { className: "panel" }, h("div", { className: "panel-title" }, h("span", null, kicker), h("h2", null, title)), children);
}

function FormGrid({ form, setForm, submit, error, children }) {
  return h("form", { className: "form-grid", onSubmit: submit }, children.map((builder) => builder(form, setForm)), error && h("p", { className: "form-error" }, error), h("button", { className: "primary", type: "submit" }, "Lưu"));
}

function input(label, key, required = false, type = "text") {
  return (form, setForm) => h("label", { key }, h("span", null, label), h("input", { required, type, value: form[key] || "", onChange: (e) => setForm({ ...form, [key]: e.target.value }) }));
}

function select(label, key, options) {
  return (form, setForm) => h("label", { key }, h("span", null, label), h("select", { value: form[key] || options[0], onChange: (e) => setForm({ ...form, [key]: e.target.value }) }, options.map((o) => h("option", { key: o }, o))));
}

function Toggle({ label, checked, onChange }) {
  return h("label", { className: "toggle" }, h("input", { type: "checkbox", checked, onChange: (e) => onChange(e.target.checked) }), h("span", null), label);
}

function NumberControl({ label, value, onChange }) {
  return h("label", null, h("span", null, label), h("input", { type: "number", value, onChange: (e) => onChange(Number(e.target.value)) }));
}

function AssetBox({ title, image, fallback, onFile }) {
  return h("div", { className: "asset-box" }, h("div", { className: "asset-preview" }, image ? h("img", { src: image }) : h("span", null, fallback || "Ảnh")), h("h3", null, title), h("input", { type: "file", accept: "image/*", onChange: (e) => e.target.files[0] && onFile(e.target.files[0]) }));
}

function CrudTable({ title, kicker, filter, setFilter, fields, rows, columns, add, remove }) {
  const [form, setForm] = useState(Object.fromEntries(fields.map(([key]) => [key, ""])));
  const visible = rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(filter.toLowerCase()));
  const submit = (e) => {
    e.preventDefault();
    add(form);
    setForm(Object.fromEntries(fields.map(([key]) => [key, ""])));
  };
  return h("div", null, h(Panel, { title, kicker }, h("form", { className: "inline-form", onSubmit: submit }, fields.map(([key, label]) => h("input", { key, required: true, placeholder: label, value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })), h("button", { className: "primary" }, "Thêm")), h("input", { className: "wide-search", value: filter, onChange: (e) => setFilter(e.target.value), placeholder: "Tìm kiếm..." })), h(DataTable, { title: "Danh sách", headers: [...columns, ""], rows: visible.map((row) => [...columns.map((c) => c === "status" ? badge(row[c]) : row[c]), h("button", { onClick: () => remove(row.id), className: "text-danger" }, "Xóa")]) }));
}

function DataTable({ title, headers = [], rows = [], compact = false }) {
  return h("section", { className: compact ? "table-panel compact-table" : "table-panel" }, title && h("div", { className: "table-head" }, h("h2", null, title), h("span", null, `${rows.length} bản ghi`)), h("div", { className: "table-wrap" }, h("table", null, headers.length > 0 && h("thead", null, h("tr", null, headers.map((x) => h("th", { key: x }, x)))), h("tbody", null, rows.map((row, i) => h("tr", { key: i }, row.map((cell, j) => h("td", { key: j }, cell))))))));
}

function badge(value) {
  const tone = ["Active", "Low", "Loyal", "Thành công"].includes(value) ? "good" : ["High", "At risk", "Callback"].includes(value) ? "bad" : "warn";
  return h("span", { className: "badge " + tone }, value);
}

function validPassword(value) {
  return value.length <= 16 && /^[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function rootCode(code) {
  return String(code || "").split(".")[0];
}

function getMenu(workspace, code) {
  return (workspace === "admin" ? adminMenu : clientMenu)[rootCode(code)] || { label: "Tổng quan", desc: "Vận hành" };
}

function menuIcon(code, workspace) {
  const icons = {
    overview: "⌂",
    1: "↗",
    2: "◎",
    3: "↺",
    4: "▣",
    5: "ST",
    6: "◈",
    7: "✓",
    8: "☷",
    9: "文",
    10: "▤",
    11: "◆",
  };
  return icons[rootCode(code)] || (workspace === "admin" ? "◆" : "•");
}

function averageScore(responses) {
  if (!responses.length) return "0.0";
  return (responses.reduce((sum, row) => sum + Number(row.score), 0) / responses.length).toFixed(1);
}

function audit(event, actor, result) {
  return { time: now(), event, actor, result };
}

createRoot(document.getElementById("root")).render(h(App));
