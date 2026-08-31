'use server';

/**
 * Hanh dong cho man /studio/bien-soan.
 *
 * workspaceId luon doc tu workspaceHienTai(), khong nhan tu client.
 */

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import { sinhAnhChoBai } from '@/lib/studio/anh';
import { bienSoanBai, ghepHashtag } from '@/lib/studio/bien-soan';
import { sinhKichBan } from '@/lib/studio/kich-ban';
import type { BanNhapBai, BanNhapKichBan } from '@/lib/studio/kieu';

export type KetQuaSinhBai =
  | { ok: true; banNhap: BanNhapBai; moHinh: string | null }
  | { ok: false; loi: string };

export async function sinhBanNhap(ideaId: string, epDoDai?: number): Promise<KetQuaSinhBai> {
  const workspaceId = await workspaceHienTai();
  const ket = await bienSoanBai({ workspaceId, ideaId, epDoDai });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'Sinh nội dung không xong. Thử lại.' };
  }
  return { ok: true, banNhap: ket.du, moHinh: ket.moHinh };
}

export type KetQuaLuuBai = { ok: true; contentId: string } | { ok: false; loi: string };

/**
 * Luu ban nhap NGUOI DUNG DA SUA vao contents, danh dau y tuong da dung.
 *
 * Khong chay lai bienSoanBai o day - luu dung ban nguoi dung dang xem, khong
 * phai ban goc cua mo hinh.
 */
export async function luuNoiDung(
  ideaId: string,
  banNhap: BanNhapBai,
  moHinh: string | null,
): Promise<KetQuaLuuBai> {
  const noiDung = banNhap.noiDung.trim();
  if (noiDung === '') return { ok: false, loi: 'Chưa có nội dung để lưu.' };

  const workspaceId = await workspaceHienTai();
  const repo = createRepo(workspaceId);

  const y = await repo.yTuong.layTheoId(ideaId);
  if (!y) return { ok: false, loi: 'Không tìm thấy ý tưởng này.' };

  const dong = await repo.contents.tao({
    ideaId: y.id,
    beMat: y.beMat,
    pillarId: y.pillarId,
    personaId: y.personaId,
    productId: y.productId,
    gocTiepCan: y.gocTiepCan,
    cauMoDau: y.cauMoDau,
    noiDung: ghepHashtag(noiDung, banNhap.hashtag),
    moHinhDaSinh: moHinh,
    nguonYTuong: y.nguonYTuong,
    trangThai: 'ban_nhap',
  });

  await repo.yTuong.sua(ideaId, { daDung: true });

  revalidatePath('/studio/bien-soan');
  revalidatePath('/bai-da-dang');
  return { ok: true, contentId: dong.id };
}

export type KetQuaSinhAnh =
  | { ok: true; duongDan: string }
  | { ok: false; loi: string };

export async function sinhAnhAction(contentId: string): Promise<KetQuaSinhAnh> {
  const workspaceId = await workspaceHienTai();
  const ket = await sinhAnhChoBai({ workspaceId, contentId });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'Sinh ảnh không xong. Thử lại.' };
  }
  revalidatePath('/bai-da-dang');
  return { ok: true, duongDan: ket.du.duongDan };
}

export type KetQuaSinhKichBan =
  | { ok: true; banNhap: BanNhapKichBan; moHinh: string | null }
  | { ok: false; loi: string };

export async function sinhKichBanAction(ideaId: string): Promise<KetQuaSinhKichBan> {
  const workspaceId = await workspaceHienTai();
  const ket = await sinhKichBan({ workspaceId, ideaId });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'Sinh kịch bản không xong. Thử lại.' };
  }
  return { ok: true, banNhap: ket.du, moHinh: ket.moHinh };
}

/** contents khong co cot luu tung canh - dinh dang phang thanh van ban co moc thoi gian. */
function dinhDangKichBan(kichBan: BanNhapKichBan): string {
  let t = 0;
  const dong = kichBan.phanCanh.map((canh) => {
    const batDau = t;
    t += canh.thoiLuongGiay;
    const loiThoai = canh.loiThoai.trim() !== '' ? `\nLời thoại: ${canh.loiThoai}` : '';
    return `[${batDau}–${t}s] Hình: ${canh.hinhAnh}${loiThoai}`;
  });
  return `Tiêu đề: ${kichBan.tieuDe}\n\n${dong.join('\n\n')}`;
}

export async function luuKichBan(
  ideaId: string,
  banNhap: BanNhapKichBan,
  moHinh: string | null,
): Promise<KetQuaLuuBai> {
  if (banNhap.phanCanh.length === 0) return { ok: false, loi: 'Chưa có cảnh quay nào để lưu.' };

  const workspaceId = await workspaceHienTai();
  const repo = createRepo(workspaceId);

  const y = await repo.yTuong.layTheoId(ideaId);
  if (!y) return { ok: false, loi: 'Không tìm thấy ý tưởng này.' };

  const dong = await repo.contents.tao({
    ideaId: y.id,
    beMat: y.beMat,
    pillarId: y.pillarId,
    personaId: y.personaId,
    productId: y.productId,
    gocTiepCan: y.gocTiepCan,
    cauMoDau: y.cauMoDau,
    dangBai: 'kich_ban_quay',
    noiDung: dinhDangKichBan(banNhap),
    moHinhDaSinh: moHinh,
    nguonYTuong: y.nguonYTuong,
    trangThai: 'ban_nhap',
  });

  await repo.yTuong.sua(ideaId, { daDung: true });

  revalidatePath('/studio/bien-soan');
  revalidatePath('/bai-da-dang');
  return { ok: true, contentId: dong.id };
}
