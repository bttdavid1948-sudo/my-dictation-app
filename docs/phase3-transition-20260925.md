# Phase 3: chuyển sang Kho bài học chính thức

Quyết định Owner ngày 2026-09-25 thay thế mọi mô tả cũ về người dùng gửi bài vào kho chung. Cloud Shell import/restore đang chờ tạm dừng. PR #12 và #20 đã đóng mà không merge.

## Ranh giới dữ liệu

| Nguồn | Nội dung | Đọc | Ghi/xuất bản |
| --- | --- | --- | --- |
| `user_vocab/{uid}` | Bài cá nhân do người dùng tạo/import | Chỉ UID chủ sở hữu | Chỉ UID chủ sở hữu; transaction phát hiện bản lưu cũ |
| `assets/official-lessons.json` | Bài chính thức do Mặn soạn/kiểm quyền | Mọi người qua GitHub Pages | Chỉ qua thay đổi repo được QA và duyệt để phát hành; client không thể ghi |
| `community_units` | Bài do người dùng từng gửi trong mô hình cũ | Chưa kiểm kê production; Rules nháp chỉ cho tác giả đọc | Không thêm/sửa/xóa từ client; không lấy làm bài chính thức |

Danh mục tĩnh có `publisher: man`, ID ổn định, version, status, mức độ/chủ đề, câu Anh–Việt và bằng chứng nguồn/quyền. Không coi giá trị `publisher` ở client là cơ chế bảo mật; cơ chế xuất bản là quyền sửa repo + review + deploy. Bài người dùng không bao giờ được đưa vào danh mục bằng thao tác trong app. Không chuyển nguyên bài legacy dù đang có `sharingStatus=approved/public` nếu chưa xác minh quyền và dữ liệu.

## Phạm vi ảnh hưởng và xử lý

| Mặt | Giữ/thiết kế lại | Bỏ hoặc trì hoãn |
| --- | --- | --- |
| Sản phẩm/UX | Học thử, bài riêng, Kho bài học, tiến bộ, để dành, chủ đề/trình độ | Lời mời đóng góp, gửi duyệt, trạng thái chờ/từ chối, thống kê tác giả |
| Mã/UI/copy | Header/mobile, chọn bài, thư viện, tìm kiếm, học và kết quả dẫn tới `#catalog`; đường cũ `#community` chuyển tới catalog | Checkbox chia sẻ, metadata quyền của user, ghi `community_units`, bộ đếm phiên cộng đồng, trang Đóng góp |
| Firestore | `user_vocab/{uid}` riêng, các profile/feedback được rà riêng | Client tạo/cập nhật/xóa `community_units`; không tạo `official_lessons` Firestore ở giai đoạn này |
| Rules/quyền | Draft deny client writes vào legacy; tác giả còn đường đọc dữ liệu cũ; kho JSON chỉ qua repo | Admin/đặc quyền xuất bản trên client, quyền duyệt và cập nhật số liệu đóng góp |
| Nội dung | Bài gốc Mặn soạn, metadata nguồn, kiểm Anh–Việt, duyệt PR trước phát hành | Tự lấy bài user/nguồn chưa rõ quyền làm seed |
| Tests | Danh mục chỉ nhận bài `publisher=man`, Rules emulator chặn guest và user publish, đồng bộ riêng hai phiên, desktop/mobile | Test trạng thái pending/rejected/approved, resubmission/moderation và system credit qua `community_units` |
| Migration | Đọc inventory rồi lập bản đồ dữ liệu và quy trình giữ/ẩn/xuất | Không xóa, import, reclassify hay copy production legacy ngay |

## Inventory production trước mọi thay đổi dữ liệu

Inventory production và Rules hiện hành đã được kiểm tra qua kênh nội bộ riêng. Phát hiện cấu hình quyền hiện hành không đáp ứng kiến trúc bài riêng/kho chính thức; chi tiết và bằng chứng nằm trong Technical & Operations Manual nội bộ, không xuất bản trong repository công khai. Không suy số tài liệu từ kích thước export; chưa có kiểm thử khôi phục backup. Lệnh import/restore tiếp tục tạm dừng theo Owner.

## Chuyển production an toàn

1. Hoàn thành QA nội dung original và kiểm giao diện/đồng bộ bằng môi trường thử. PR này là nháp, không tự merge.
2. Đã kiểm tra inventory và Rules production trong nguồn nội bộ. So toàn bộ chức năng còn dùng (Auth, profile, `user_vocab`, feedback, notifications) với Rules nháp; thay cả Rules hiện hành để quyền cũ không vô hiệu hóa các điều kiện mới. Bảng xếp hạng tạm nghỉ để giữ hồ sơ riêng tư.
3. Chuẩn bị thay Rules có quy trình sửa lỗi/khôi phục quyền hẹp và kiểm thử hai tài khoản; đây là approval gate production. Ưu tiên siết quyền trước rồi phát hành giao diện mới trong cùng cửa sổ. Trong khoảng chuyển tiếp giao diện cũ có thể còn nút publish và bảng xếp hạng nhưng quyền mới từ chối; không khôi phục quyền rộng cũ làm rollback.
4. Chỉ sau approval, triển khai Rules + giao diện/danh mục theo thứ tự đã thống nhất, verify live guest/login, bài cá nhân, Kho bài học, không có user publish; giám sát lỗi/chi phí và rollback khi cần.
5. Dữ liệu legacy được lưu nguyên trạng cho đến khi Owner duyệt phương án cụ thể dựa trên inventory; nếu muốn chuyển bài user sang thư viện chính thức, phải có quyền sử dụng riêng cho từng bài.

## Remaining critical path

P0: chặn quyền ghi công khai cũ và bảo vệ bài riêng; inventory/backup phục hồi được; QA luồng học và đồng bộ thật hai tài khoản. P1: tăng số lượng/chất lượng bài gốc và kiểm bản quyền; hoàn thiện auth/progress/feedback/mobile/accessibility; pilot nhỏ và đo lỗi. Không coi việc có draft PR hay Emulator pass là production ready.

## Bổ sung kiểm tra sản phẩm ngày 2026-09-25

- Luồng thử 5 câu dùng tập câu độc lập và không thêm bài vào `user_vocab`/Bài của tôi. Nút **Nạp bài mẫu** riêng vẫn là thao tác chủ động để tạo bài cá nhân.
- Lịch sử học, câu cần ôn và bài để dành lưu trên trình duyệt được phân vùng theo UID; khách dùng khóa cũ. Dữ liệu ở các khóa cũ không thể tự gán chắc chắn cho UID nào, nên được giữ ở khách và không chuyển lén sang tài khoản. Đây chưa phải đồng bộ tiến bộ nhiều thiết bị.
- Khi đăng xuất hoặc chuyển giữa hai UID, giao diện xóa bài riêng và phiên học trong bộ nhớ; lần tải hồ sơ bất đồng bộ kiểm UID trước khi hiển thị. Phiên học khôi phục chỉ nhận đúng UID sau khi Auth trả về.
- Modal Kho bài học tải lại khi mở, thông báo tình trạng tải và cập nhật danh sách khi JSON chính thức đã về. Vẫn cần chạy thử trên trình duyệt thật với hai tài khoản sau khi có môi trường kiểm thử truy cập được.
- Bảng xếp hạng cũ đọc trực tiếp `users_profile` của người khác, mâu thuẫn với Rules mới chỉ cho chủ hồ sơ đọc. Bản nháp tạm dừng bảng xếp hạng và chặn cả `leaderboard_public`; tiến bộ cá nhân vẫn hiện. Chỉ mở lại sau khi có cơ chế tham gia tự nguyện, tách dữ liệu công khai khỏi hồ sơ riêng và tính điểm đáng tin cậy.
- Copy đăng ký, tiến bộ và hồ sơ nói rõ đăng nhập lưu bài riêng trên tài khoản, còn lịch sử/để dành/câu cần ôn vẫn chỉ nằm trên trình duyệt theo danh tính. Đăng nhập không tự gán lịch sử của khách cho tài khoản vì nguồn đó không chứng minh được chủ sở hữu.
