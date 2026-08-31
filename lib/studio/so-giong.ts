/**
 * So 4 giong cua 4 be mat tu CUNG mot y tuong - dung lai `viet-bai`, chi doi
 * `bienThe` (khoa chon giong trong loi nhac) cho tung be mat. Bon luot goi
 * chay SONG SONG: du lieu vao khac nhau o `bienThe` nen khoa chong trung cua
 * hang doi la bon khoa khac nhau, khong dam vao nhau.
 */

import { chayNhiemVu } from '@/lib/model-runner';

import { donKetQuaVietBai } from './bien-soan';
import type { BeMat, CotSoGiong, KetQuaStudio } from './kieu';
import { duLieuNguCanh, layNguCanhYTuong } from './ngu-canh-y-tuong';

export type ThamSoSoGiong = {
  workspaceId: string;
  ideaId: string;
};

const BON_BE_MAT: BeMat[] = ['fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo'];

async function sinhMotCot(
  workspaceId: string,
  duLieuGoc: Record<string, unknown>,
  beMat: BeMat,
): Promise<CotSoGiong> {
  try {
    const ketQuaViec = await chayNhiemVu({
      nhiemVu: 'viet-bai',
      duLieuVao: { ...duLieuGoc, bienThe: beMat },
      moHinh: 'auto',
      khongGianLamViec: workspaceId,
    });

    if (ketQuaViec.trangThai !== 'xong' || !ketQuaViec.ketQua) {
      return {
        beMat,
        trangThai: 'loi',
        banNhap: null,
        loi: ketQuaViec.loi ?? 'Sinh nội dung không xong.',
        moHinh: ketQuaViec.moHinh,
      };
    }

    const banNhap = donKetQuaVietBai(ketQuaViec.ketQua);
    if (!banNhap.noiDung) {
      return {
        beMat,
        trangThai: 'loi',
        banNhap: null,
        loi: 'Mô hình không trả về nội dung dùng được.',
        moHinh: ketQuaViec.moHinh,
      };
    }

    return { beMat, trangThai: 'xong', banNhap, loi: null, moHinh: ketQuaViec.moHinh };
  } catch (loi) {
    return {
      beMat,
      trangThai: 'loi',
      banNhap: null,
      loi: loi instanceof Error ? loi.message : String(loi),
      moHinh: null,
    };
  }
}

export async function soSanhGiong(thamSo: ThamSoSoGiong): Promise<KetQuaStudio<CotSoGiong[]>> {
  const { workspaceId, ideaId } = thamSo;

  const nguCanh = await layNguCanhYTuong(workspaceId, ideaId);
  if (!nguCanh) {
    return { trangThai: 'loi', du: null, loi: 'Không tìm thấy ý tưởng này.', canhBao: [], moHinh: null };
  }

  const duLieuGoc = duLieuNguCanh(nguCanh);
  const cot = await Promise.all(BON_BE_MAT.map((b) => sinhMotCot(workspaceId, duLieuGoc, b)));

  if (cot.every((c) => c.trangThai === 'loi')) {
    return {
      trangThai: 'loi',
      du: null,
      loi: 'Cả 4 bề mặt đều sinh không xong, thử lại.',
      canhBao: [],
      moHinh: null,
    };
  }

  return { trangThai: 'xong', du: cot, loi: null, canhBao: [], moHinh: null };
}
