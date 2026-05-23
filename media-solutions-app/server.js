const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const dataDir = path.join(root, "data");
const workbookPath = path.join(dataDir, "workbook.json");
const statePath = path.join(dataDir, "app-state.json");
const port = Number(process.env.PORT || process.argv[2] || 5173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function id() {
  return crypto.randomBytes(5).toString("hex");
}

function defaultState() {
  return {
    company: {
      name: "Công ty Media Demo",
      address: "Quận 1, TP. Hồ Chí Minh",
      country: "Việt Nam",
      owner: "David Nguyen",
      email: "david@gmail.com",
      phone: "+84 901 234 567",
      status: "Pending",
      logo: "",
      promotion: "",
    },
    staff: [
      { id: id(), name: "Nguyễn Minh Anh", role: "Quản lý chi nhánh", email: "minhanh@demo.vn", phone: "0901234567", status: "Active" },
      { id: id(), name: "Trần Quốc Huy", role: "CSKH", email: "huy@demo.vn", phone: "0902234567", status: "Active" },
      { id: id(), name: "Lê Bảo Ngọc", role: "Marketing", email: "ngoc@demo.vn", phone: "0903234567", status: "Pending" },
    ],
    customers: [
      { id: id(), name: "Công ty An Phát", segment: "B2B", phone: "02811223344", score: 8.9, status: "Upsell", owner: "Nguyễn Minh Anh" },
      { id: id(), name: "Nhà hàng Sen Việt", segment: "SMB", phone: "02822334455", score: 9.4, status: "Loyal", owner: "Trần Quốc Huy" },
      { id: id(), name: "Spa Hoa Nắng", segment: "SMB", phone: "02833445566", score: 6.1, status: "Callback", owner: "Trần Quốc Huy" },
    ],
    survey: {
      title: "Đánh giá trải nghiệm dịch vụ",
      published: true,
      questions: [
        { id: id(), text: "Bạn đánh giá trải nghiệm hôm nay như thế nào?", type: "rating", required: true },
        { id: id(), text: "Nhân viên hỗ trợ có rõ ràng và nhanh chóng không?", type: "rating", required: true },
        { id: id(), text: "Bạn muốn góp ý thêm điều gì?", type: "text", required: false },
      ],
    },
    responses: [
      { id: id(), customer: "Sen Việt", channel: "Quầy lễ tân", score: 9.4, note: "Nhân viên thân thiện", createdAt: "2026-05-23 09:15" },
      { id: id(), customer: "Hoa Nắng", channel: "Online", score: 6.1, note: "Chờ phản hồi hơi lâu", createdAt: "2026-05-23 10:22" },
      { id: id(), customer: "An Phát", channel: "CSKH", score: 8.9, note: "Quy trình rõ ràng", createdAt: "2026-05-22 18:45" },
    ],
    businesses: [
      { id: id(), name: "An Phát Group", plan: "Enterprise", status: "Active", mrr: 148000000, lastSeen: "2 giờ trước", risk: "Low" },
      { id: id(), name: "Sen Việt Hospitality", plan: "Growth", status: "Active", mrr: 48000000, lastSeen: "1 ngày trước", risk: "Low" },
      { id: id(), name: "Hoa Nắng Spa", plan: "Starter", status: "Trial", mrr: 0, lastSeen: "5 phút trước", risk: "Medium" },
      { id: id(), name: "ABC Education", plan: "Growth", status: "At risk", mrr: 32000000, lastSeen: "8 ngày trước", risk: "High" },
    ],
    tickets: [{ id: id(), business: "ABC Education", issue: "Hoạt động giảm 45%", priority: "High", status: "Open" }],
    settings: { language: "Tiếng Việt", currency: "VND", timezone: "Asia/Saigon", dateFormat: "DD/MM/YYYY" },
    security: { otp: "482913", channel: "Email", maxAttempts: 5, lockMinutes: 15, twoFactor: true, loginFailures: 0 },
    audit: [
      { time: "2026-05-23 09:18", event: "Đăng nhập", actor: "owner@company.vn", result: "Thành công" },
      { time: "2026-05-23 09:21", event: "Gửi OTP", actor: "Email", result: "Thành công" },
    ],
  };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, payload) {
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
}

function send(res, status, payload, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.normalize(path.join(root, requested));
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/workbook" && req.method === "GET") {
      return send(res, 200, readJson(workbookPath, { sheets: [] }));
    }

    if (req.url === "/api/state" && req.method === "GET") {
      const state = readJson(statePath, null) || defaultState();
      if (!fs.existsSync(statePath)) writeJson(statePath, state);
      return send(res, 200, state);
    }

    if (req.url === "/api/state" && req.method === "POST") {
      const state = await readBody(req);
      writeJson(statePath, state);
      return send(res, 200, { ok: true });
    }

    if (req.url === "/api/reset" && req.method === "POST") {
      const state = defaultState();
      writeJson(statePath, state);
      return send(res, 200, state);
    }

    const file = safeStaticPath(req.url);
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      return send(res, 404, "Not found", "text/plain; charset=utf-8");
    }
    const ext = path.extname(file);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error("");
    console.error(`Port ${port} is already in use.`);
    console.error(`Open http://127.0.0.1:${port}/ if the app is already running.`);
    console.error("Or run on another port, for example:");
    console.error("  node server.js 5174");
    console.error("");
    process.exit(1);
  }
  throw error;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Media Solutions CRM running at http://127.0.0.1:${port}/`);
});
