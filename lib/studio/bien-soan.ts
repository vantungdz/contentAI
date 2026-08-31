/**
 * Cua chinh cua man /studio/bien-soan - tu 1 y tuong da luu, sinh ra 1 bai dang
 * hoan chinh de nguoi dung xem/sua roi moi luu vao contents.
 */

import { chayNhiemVu } from '@/lib/model-runner';

import type { BanNhapBai, KetQuaStudio } from './kieu';
import { duLieuNguCanh, layNguCanhYTuong } from './ngu-canh-y-tuong';

export type ThamSoBienSoan = {
  workspaceId: string;
  ideaId: string;
  /** So tu bat buoc cho lan viet nay - bo trong thi dung tran mac dinh cua be mat. */
  epDoDai?: number;
};

function chuoiHoacNull(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

/** Don ket qua mo hinh ve BanNhapBai. Ham thuan, test bang du lieu tay duoc. */
export function donKetQuaVietBai(tho: unknown): BanNhapBai {
  const goc = (tho ?? {}) as Record<string, unknown>;
  const hashtagTho = goc.hashtag;
  return {
    tieuDe: chuoiHoacNull(goc.tieuDe) ?? '',
    noiDung: chuoiHoacNull(goc.noiDung) ?? '',
    hashtag: Array.isArray(hashtagTho)
      ? hashtagTho.filter((h): h is string => typeof h === 'string' && h.trim() !== '')
      : [],
  };
}

export async function bienSoanBai(thamSo: ThamSoBienSoan): Promise<KetQuaStudio<BanNhapBai>> {
  const { workspaceId, ideaId, epDoDai } = thamSo;

  const nguCanh = await layNguCanhYTuong(workspaceId, ideaId);
  if (!nguCanh) {
    return { trangThai: 'loi', du: null, loi: 'Không tìm thấy ý tưởng này.', canhBao: [], moHinh: null };
  }

  const duLieuVao = duLieuNguCanh(nguCanh);
  if (typeof epDoDai === 'number' && epDoDai > 0) duLieuVao.epDoDai = epDoDai;

  let ketQuaViec;
  try {
    ketQuaViec = await chayNhiemVu({
      nhiemVu: 'viet-bai',
      duLieuVao,
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
      loi: ketQuaViec.loi ?? 'Sinh nội dung không xong.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }

  const banNhap = donKetQuaVietBai(ketQuaViec.ketQua);
  if (!banNhap.noiDung) {
    return {
      trangThai: 'loi',
      du: null,
      loi: 'Mô hình không trả về nội dung dùng được.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }

  return { trangThai: 'xong', du: banNhap, loi: null, canhBao: [], moHinh: ketQuaViec.moHinh };
}

/**
 * Ghep hashtag vao cuoi noi dung khi luu - contents khong co cot rieng cho
 * hashtag. Dung chung cho luu tay (/studio/bien-soan) va luu tu dong
 * (/studio/hang-loat).
 */
export function ghepHashtag(noiDung: string, hashtag: string[]): string {
  const sach = hashtag
    .map((h) => h.trim())
    .filter((h) => h !== '')
    .map((h) => (h.startsWith('#') ? h : `#${h}`));
  if (sach.length === 0) return noiDung;
  return `${noiDung}\n\n${sach.join(' ')}`;
}
