/**
 * Cua chinh cho kich ban quay video - moc 3. Khong co man hinh rieng nhu
 * /studio/bien-soan, day chi la mot cua ra khac cho CUNG mot y tuong (xem
 * TEST-BRIEF.md muc 3: kich ban la mot trong "hai dau ra ngoai chu" cua bai
 * dang, khong phai mot duong dan rieng).
 */

import { chayNhiemVu } from '@/lib/model-runner';

import type { BanNhapKichBan, KetQuaStudio, PhanCanh } from './kieu';
import { duLieuNguCanh, layNguCanhYTuong } from './ngu-canh-y-tuong';

export type ThamSoKichBan = {
  workspaceId: string;
  ideaId: string;
};

function chuoiHoacNull(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

function donPhanCanh(tho: unknown): PhanCanh[] {
  if (!Array.isArray(tho)) return [];
  const ketQua: PhanCanh[] = [];
  for (const canh of tho) {
    if (!canh || typeof canh !== 'object') continue;
    const c = canh as Record<string, unknown>;
    const thoiLuongGiay =
      typeof c.thoiLuongGiay === 'number' && Number.isFinite(c.thoiLuongGiay)
        ? Math.max(1, Math.round(c.thoiLuongGiay))
        : null;
    const hinhAnh = chuoiHoacNull(c.hinhAnh);
    if (!thoiLuongGiay || !hinhAnh) continue; // canh khong co hinh de quay thi bo, khong doan
    ketQua.push({ thoiLuongGiay, hinhAnh, loiThoai: chuoiHoacNull(c.loiThoai) ?? '' });
  }
  return ketQua;
}

/** Don ket qua mo hinh ve BanNhapKichBan. Ham thuan, test bang du lieu tay duoc. */
export function donKetQuaVietKichBan(tho: unknown): BanNhapKichBan {
  const goc = (tho ?? {}) as Record<string, unknown>;
  return {
    tieuDe: chuoiHoacNull(goc.tieuDe) ?? '',
    phanCanh: donPhanCanh(goc.phanCanh),
  };
}

export async function sinhKichBan(thamSo: ThamSoKichBan): Promise<KetQuaStudio<BanNhapKichBan>> {
  const { workspaceId, ideaId } = thamSo;

  const nguCanh = await layNguCanhYTuong(workspaceId, ideaId);
  if (!nguCanh) {
    return { trangThai: 'loi', du: null, loi: 'Không tìm thấy ý tưởng này.', canhBao: [], moHinh: null };
  }

  let ketQuaViec;
  try {
    ketQuaViec = await chayNhiemVu({
      nhiemVu: 'viet-kich-ban',
      duLieuVao: duLieuNguCanh(nguCanh),
      moHinh: 'auto',
      khongGianLamViec: workspaceId,
    });
  } catch (loi) {
    return {
      trangThai: 'loi',
      du: null,
      loi: loi instanceof Error ? loi.message : String(loi),
      canhBao: [],
      moHinh: null,
    };
  }

  if (ketQuaViec.trangThai !== 'xong' || !ketQuaViec.ketQua) {
    return {
      trangThai: ketQuaViec.trangThai,
      du: null,
      loi: ketQuaViec.loi ?? 'Sinh kịch bản không xong.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }

  const banNhap = donKetQuaVietKichBan(ketQuaViec.ketQua);
  if (banNhap.phanCanh.length === 0) {
    return {
      trangThai: 'loi',
      du: null,
      loi: 'Mô hình không trả về cảnh quay nào dùng được.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }

  return { trangThai: 'xong', du: banNhap, loi: null, canhBao: [], moHinh: ketQuaViec.moHinh };
}
