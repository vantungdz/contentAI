/**
 * Sinh anh cho MOT bai dang da luu - moc 5. Khac cac nhiem vu khac: khong co
 * buoc xem-sua (anh khong sua duoc bang chu), sinh xong la luu thang vao
 * `assets`.
 */

import { createRepo } from '@/lib/data-access';
import { luuAnhSinh } from '@/lib/keo-bai/kho-anh';
import { chayNhiemVu } from '@/lib/model-runner';

import type { KetQuaStudio } from './kieu';

export type ThamSoSinhAnh = {
  workspaceId: string;
  contentId: string;
};

export type KetQuaAnh = {
  assetId: string;
  duongDan: string;
};

export async function sinhAnhChoBai(thamSo: ThamSoSinhAnh): Promise<KetQuaStudio<KetQuaAnh>> {
  const { workspaceId, contentId } = thamSo;
  const repo = createRepo(workspaceId);

  const noiDung = await repo.contents.layTheoId(contentId);
  if (!noiDung) {
    return {
      trangThai: 'loi',
      du: null,
      loi: 'Không tìm thấy bài đăng này.',
      canhBao: [],
      moHinh: null,
    };
  }

  let ketQuaViec;
  try {
    ketQuaViec = await chayNhiemVu({
      nhiemVu: 'sinh-anh',
      duLieuVao: { noiDung: noiDung.noiDung, gocTiepCan: noiDung.gocTiepCan, contentId },
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
      loi: ketQuaViec.loi ?? 'Sinh ảnh không xong.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }

  const tho = ketQuaViec.ketQua as { anhBase64?: unknown; mimeType?: unknown };
  if (typeof tho.anhBase64 !== 'string') {
    return {
      trangThai: 'loi',
      du: null,
      loi: 'Mô hình không trả về ảnh dùng được.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }
  const mimeType = typeof tho.mimeType === 'string' ? tho.mimeType : 'image/png';

  const buffer = Buffer.from(tho.anhBase64, 'base64');
  const daLuu = await luuAnhSinh(workspaceId, buffer, mimeType);
  if (!daLuu.ok) {
    return { trangThai: 'loi', du: null, loi: daLuu.loi, canhBao: [], moHinh: ketQuaViec.moHinh };
  }

  const asset = await repo.asset.tao({
    contentId,
    loai: 'anh',
    duongDan: daLuu.duongDan,
    kichThuocByte: daLuu.soByte,
  });

  return {
    trangThai: 'xong',
    du: { assetId: asset.id, duongDan: daLuu.duongDan },
    loi: null,
    canhBao: [],
    moHinh: ketQuaViec.moHinh,
  };
}
