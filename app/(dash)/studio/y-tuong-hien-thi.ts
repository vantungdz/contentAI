/**
 * ideas khong co cot tieu de rieng - mốc đề xuất đã ghép tieuDe vào đầu
 * lyDoDeXuat khi lưu (xem app/(dash)/studio/de-xuat/actions.ts). Tách lại ở
 * đây để các màn khác trong Studio hiển thị được tiêu đề, không phải đoán mò.
 */
export function tachTieuDeTuLyDo(lyDoDeXuat: string | null): {
  tieuDe: string;
  lyDo: string | null;
} {
  if (!lyDoDeXuat) return { tieuDe: 'Ý tưởng chưa có tiêu đề', lyDo: null };
  const idx = lyDoDeXuat.indexOf(' — ');
  if (idx === -1) return { tieuDe: lyDoDeXuat, lyDo: null };
  return { tieuDe: lyDoDeXuat.slice(0, idx), lyDo: lyDoDeXuat.slice(idx + 3) };
}
