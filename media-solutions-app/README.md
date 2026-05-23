# Media Solutions CRM

React + Node.js local app dựng theo yêu cầu nghiệp vụ trong workbook `Bản sao của Kịch bản sản phẩm.xlsx`.

## Chạy app

```powershell
cd "D:\Downloads\Media Solutions\media-solutions-app"
node server.js
```

Mở:

```text
http://127.0.0.1:5173/
```

## Kiến trúc

- `server.js`: Node.js HTTP server không cần cài package, phục vụ static app và API.
- `src/app.js`: React app.
- `src/styles.css`: UI/UX cho dashboard, form, bảng, survey, mobile customer screen.
- `data/workbook.json`: dữ liệu yêu cầu đã parse đủ 4 sheet Excel, dùng nội bộ để thiết kế menu và luồng nghiệp vụ.
- `data/app-state.json`: dữ liệu vận hành local của app.

## API local

- `GET /api/workbook`: đọc đủ 4 sheet Excel đã parse.
- `GET /api/state`: lấy dữ liệu vận hành.
- `POST /api/state`: lưu dữ liệu vận hành.
- `POST /api/reset`: reset dữ liệu demo.

## Phạm vi chức năng hiện tại

- Đọc đủ 4 sheet yêu cầu: Super Admin Dashboard, Client CRM, Chức năng các Module, Module Client CRM.
- Client CRM: đăng ký, xác thực/bảo mật, quên mật khẩu, upload logo/ảnh, nhân sự, khách hàng, survey builder, lịch sử khảo sát, localization, màn hình khách hàng.
- Super Admin: metric, doanh nghiệp, MRR, risk, ticket hỗ trợ.
- Dữ liệu được lưu qua Node API vào `data/app-state.json`.
- UI khách dùng không trình chiếu nội dung Excel; Excel chỉ là blueprint để xây app.

## Lưu ý production

App hiện là bản local đầy đủ UI và logic demo. Để giao khách dùng production cần bổ sung database thật, auth/session, phân quyền, OTP/email/SMS thật, upload storage, audit log bất biến, backup, realtime và triển khai server bảo mật.
