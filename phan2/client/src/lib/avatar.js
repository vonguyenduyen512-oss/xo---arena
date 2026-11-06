// Ảnh đại diện dạng hình. '👧' = ảnh riêng của tài khoản Nguyễn Duyên;
// 'duo' = ảnh mặc định cho mọi tài khoản khác (khách, tài khoản ảo...).
export const GALLERY = Array.from({ length: 20 }, (_, i) => 'a' + (i + 1)) // 20 avatar chọn được cho mọi tài khoản
export const AVATAR_PHOTOS = {
  '👧': '/img/avatar.png', duo: '/img/avatars/a18.webp',
  ...Object.fromEntries(GALLERY.map((k) => [k, `/img/avatars/${k}.webp`])),
}
export const photoOf = (a) => AVATAR_PHOTOS[a] || null
