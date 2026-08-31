/**
 * Chuoi bai noi mach - tu 1 y tuong sinh bai TIEP THEO trong mot chuoi, khong
 * lap y cac bai truoc da noi. Dung lai `viet-bai` (khong phai nhiem vu rieng):
 * chi khac o cho co them "mach" trong du lieu vao - phan chi dan cho mo hinh
 * biet cach dung "mach" da viet san tu moc 2 (xem loi-nhac-theo-nhiem-vu.js).
 */

import { randomUUID } from 'node:crypto';

import { createRepo } from '@/lib/data-access';
import { chayNhiemVu } from '@/lib/model-runner';

import { donKetQuaVietBai } from './bien-soan';
import type { BanNhapBai, KetQuaStudio } from './kieu';
import { duLieuNguCanh, layNguCanhYTuong } from './ngu-canh-y-tuong';

export type ThamSoChuoiBai = {
  workspaceId: string;
  ideaId: string;
  /** Bo trong = bat dau mot chuoi moi. */
  chuoiId?: string;
};

export type KetQuaSinhChuoiBai = BanNhapBai & { chuoiId: string; thuTu: number };

/** Cat gon moi bai truoc khi dua vao "mach" - tranh loi nhac phinh to theo chuoi dai. */
const TRAN_KY_TU_MACH = 400;

export async function sinhBaiTrongChuoi(
  thamSo: ThamSoChuoiBai,
): Promise<KetQuaStudio<KetQuaSinhChuoiBai>> {
  const { workspaceId, ideaId, chuoiId } = thamSo;
  const repo = createRepo(workspaceId);

  const nguCanh = await layNguCanhYTuong(workspaceId, ideaId);
  if (!nguCanh) {
    return { trangThai: 'loi', du: null, loi: 'Không tìm thấy ý tưởng này.', canhBao: [], moHinh: null };
  }

  let mach: { thuTu: number; noiDung: string }[] = [];
  let chuoiIdDung = chuoiId;
  let thuTuMoi = 1;

  if (chuoiIdDung) {
    const baiCu = await repo.contents.theoChuoi(chuoiIdDung);
    if (baiCu.length === 0) {
      return { trangThai: 'loi', du: null, loi: 'Không tìm thấy chuỗi bài này.', canhBao: [], moHinh: null };
    }
    mach = baiCu.map((b) => ({
      thuTu: b.thuTuTrongChuoi ?? 0,
      noiDung: (b.noiDung ?? '').slice(0, TRAN_KY_TU_MACH),
    }));
    thuTuMoi = Math.max(...baiCu.map((b) => b.thuTuTrongChuoi ?? 0)) + 1;
  } else {
    chuoiIdDung = randomUUID();
  }

  const duLieuVao = { ...duLieuNguCanh(nguCanh), mach };

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

  return {
    trangThai: 'xong',
    du: { ...banNhap, chuoiId: chuoiIdDung, thuTu: thuTuMoi },
    loi: null,
    canhBao: [],
    moHinh: ketQuaViec.moHinh,
  };
}
