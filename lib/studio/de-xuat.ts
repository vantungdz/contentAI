/**
 * Cua chinh cua man /studio/de-xuat.
 *
 * Doc ho so thuong hieu + tru cot + chan dung + insight, goi mo hinh, don ket
 * qua ve dung hinh dang, roi rai theo ti le tru cot. Ten tru cot/chan dung mo
 * hinh tra ve ma khong khop ho so thi dat null, khong giu nguyen (xem
 * donKetQuaDeXuat).
 *
 * Tam thoi chua doc tin hieu xu huong o day - ThamSoDeXuat khong co userId ma
 * theo_doi_cua_toi lai la du lieu rieng tung nguoi, doc thang vao day khong
 * dung cach. Ghi trong GHI-CHU.md.
 */

import { createRepo } from '@/lib/data-access';
import type { TruCot } from '@/lib/data-access/content-pillars';
import type { Insight } from '@/lib/data-access/insights';
import { chayNhiemVu } from '@/lib/model-runner';
import type { ChanDung } from '@/lib/data-access/personas';
import type { SanPham } from '@/lib/data-access/products';

import type { BeMat, KetQuaStudio, YTuongDeXuat } from './kieu';

/** Ti le co dinh cho y tuong "do duong" (khamPha), khong phu thuoc tru cot. */
export const TI_LE_KHAM_PHA = 0.2;

export type ThamSoDeXuat = {
  workspaceId: string;
  beMat: BeMat;
  soLuong: number;
};

export type TruCotMucTieu = { ten: string; tiLeMucTieu: number | null };

const BE_MAT_HOP_LE = new Set<BeMat>(['fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo']);

function chuoiHoacNull(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

/**
 * Don ket qua tho cua mo hinh ve YTuongDeXuat[].
 *
 * truCotHopLe/chanDungHopLe la ten that trong ho so workspace - mo hinh tra ten
 * khong khop thi dat null luon, khong giu ten no tu bia ra.
 */
export function donKetQuaDeXuat(
  tho: unknown,
  truCotHopLe: string[],
  chanDungHopLe: string[],
): YTuongDeXuat[] {
  const mang = (tho as { yTuong?: unknown })?.yTuong;
  if (!Array.isArray(mang)) return [];

  const truCotSet = new Set(truCotHopLe);
  const chanDungSet = new Set(chanDungHopLe);
  const ketQua: YTuongDeXuat[] = [];

  for (const muc of mang) {
    if (!muc || typeof muc !== 'object') continue;
    const m = muc as Record<string, unknown>;

    const tieuDe = chuoiHoacNull(m.tieuDe);
    if (!tieuDe) continue; // khong tieu de thi bo, khong co gi de hien

    const beMatTho = chuoiHoacNull(m.beMat);
    if (!beMatTho || !BE_MAT_HOP_LE.has(beMatTho as BeMat)) continue; // be mat sai thi bo luon

    const truCotTho = chuoiHoacNull(m.truCot);
    const chanDungTho = chuoiHoacNull(m.chanDung);

    ketQua.push({
      tieuDe,
      truCot: truCotTho && truCotSet.has(truCotTho) ? truCotTho : null,
      chanDung: chanDungTho && chanDungSet.has(chanDungTho) ? chanDungTho : null,
      gocTiepCan: chuoiHoacNull(m.gocTiepCan),
      cauMoDau: chuoiHoacNull(m.cauMoDau),
      lyDoDeXuat: chuoiHoacNull(m.lyDoDeXuat),
      beMat: beMatTho as BeMat,
      khamPha: m.kham_pha === true,
    });
  }

  return ketQua;
}

/**
 * Rai N y tuong theo ti le tru cot muc tieu.
 *
 * Danh truoc phan TI_LE_KHAM_PHA cho y tuong khamPha (khong tinh vao tru cot
 * nao), roi rai phan con lai theo tiLeMucTieu cua tung tru cot. Con thieu cho
 * (lam tron hut, tru cot het y tuong, tru cot khong dat ti le...) thi lay dai
 * y tuong nao con lai, giu nguyen thu tu mo hinh tra ve.
 *
 * Ham thuan, khong dung DB, test tay duoc.
 */
export function raiTheoTruCot(
  yTuongTho: YTuongDeXuat[],
  truCotMucTieu: TruCotMucTieu[],
  soLuong: number,
): YTuongDeXuat[] {
  if (soLuong <= 0 || yTuongTho.length === 0) return [];

  const conLai = [...yTuongTho];
  const rutRa = (dieuKien: (y: YTuongDeXuat) => boolean): YTuongDeXuat | null => {
    const i = conLai.findIndex(dieuKien);
    if (i === -1) return null;
    return conLai.splice(i, 1)[0];
  };

  const ketQua: YTuongDeXuat[] = [];

  const soKhamPha = Math.round(soLuong * TI_LE_KHAM_PHA);
  for (let i = 0; i < soKhamPha; i += 1) {
    const y = rutRa((y) => y.khamPha);
    if (!y) break;
    ketQua.push(y);
  }

  const soConLaiCanRai = soLuong - ketQua.length;
  if (soConLaiCanRai > 0) {
    const coTiLe = truCotMucTieu.filter(
      (t): t is TruCotMucTieu & { tiLeMucTieu: number } => typeof t.tiLeMucTieu === 'number',
    );
    const tongTiLe = coTiLe.reduce((tong, t) => tong + t.tiLeMucTieu, 0);

    for (const truCot of coTiLe) {
      if (ketQua.length >= soLuong) break;
      const phan = tongTiLe > 0 ? truCot.tiLeMucTieu / tongTiLe : 0;
      const soChoTruCot = Math.round(soConLaiCanRai * phan);
      for (let i = 0; i < soChoTruCot && ketQua.length < soLuong; i += 1) {
        const y = rutRa((y) => y.truCot === truCot.ten);
        if (!y) break;
        ketQua.push(y);
      }
    }
  }

  while (ketQua.length < soLuong && conLai.length > 0) {
    ketQua.push(conLai.shift() as YTuongDeXuat);
  }

  return ketQua;
}

/**
 * Doc ho so, goi mo hinh, don, rai, tra ket qua.
 *
 * Khong ghi DB o day, chi sinh thoi - nguoi dung phai xem va chon truoc khi
 * luu (giong cach /brand lam voi xemTruocBocTach/luuBanNhap).
 */
export async function deXuatYTuong(
  thamSo: ThamSoDeXuat,
): Promise<KetQuaStudio<YTuongDeXuat[]>> {
  const { workspaceId, beMat, soLuong } = thamSo;
  const repo = createRepo(workspaceId);

  const [hoSo, sanPham, chanDung, truCot, insight] = await Promise.all([
    repo.hoSo.layHoacTao(),
    repo.sanPham.list(),
    repo.chanDung.list(),
    repo.truCot.list(),
    repo.insight.list(),
  ]);

  const truCotMucTieu: TruCotMucTieu[] = (truCot as TruCot[]).map((t) => ({
    ten: t.ten,
    tiLeMucTieu: t.tiLeMucTieu === null ? null : Number(t.tiLeMucTieu),
  }));

  const duLieuVao = {
    beMat,
    soLuong,
    hoSo: { moTa: hoSo.moTa, giongDieu: hoSo.giongDieu, dieuCamKy: hoSo.dieuCamKy },
    sanPham: (sanPham as SanPham[]).map((s) => ({
      ten: s.ten,
      gia: s.gia,
      loiIch: s.loiIch,
      phanDoiThuongGap: s.phanDoiThuongGap,
      loiKeuGoi: s.loiKeuGoi,
    })),
    chanDung: (chanDung as ChanDung[]).map((c) => ({
      ten: c.ten,
      doTuoi: c.doTuoi,
      ngheNghiep: c.ngheNghiep,
      noiDau: c.noiDau,
      mongMuon: c.mongMuon,
    })),
    truCot: truCotMucTieu,
    insight: (insight as Insight[]).map((i) => ({ noiDung: i.noiDung, bangChung: i.bangChung })),
    // bienThe chon giong be mat trong loi nhac, bi rut ra truoc khi goi mo hinh
    // (xem thuc-thi-nhiem-vu.js), khong phai du lieu that.
    bienThe: beMat,
  };

  let ketQuaViec;
  try {
    ketQuaViec = await chayNhiemVu({
      nhiemVu: 'de-xuat-y-tuong',
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
      loi: ketQuaViec.loi ?? 'Đề xuất ý tưởng không xong.',
      canhBao: [],
      moHinh: ketQuaViec.moHinh,
    };
  }

  const tenTruCot = (truCot as TruCot[]).map((t) => t.ten);
  const tenChanDung = (chanDung as ChanDung[]).map((c) => c.ten);
  const daDon = donKetQuaDeXuat(ketQuaViec.ketQua, tenTruCot, tenChanDung);
  const daRai = raiTheoTruCot(daDon, truCotMucTieu, soLuong);

  return { trangThai: 'xong', du: daRai, loi: null, canhBao: [], moHinh: ketQuaViec.moHinh };
}
