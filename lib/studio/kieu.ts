/**
 * Kieu dung chung cho lib/studio/* - lop nghiep vu ngoi giua man hinh va
 * chayNhiemVu().
 */

import type { TrangThaiViec } from '@/lib/model-runner';

/** Phai khop be_mat enum trong db/schema/content.ts. */
export type BeMat = 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo';

export type YTuongDeXuat = {
  tieuDe: string;
  /** Ten that trong content_pillars, khong khop thi null. */
  truCot: string | null;
  /** Ten that trong personas, khong khop thi null. */
  chanDung: string | null;
  gocTiepCan: string | null;
  cauMoDau: string | null;
  lyDoDeXuat: string | null;
  beMat: BeMat;
  /** Y tuong do duong, chua co du lieu de bam vao - xem TI_LE_KHAM_PHA. */
  khamPha: boolean;
};

/**
 * Ket qua chung cho cac cua vao cua Studio. Giong KetQuaChayNhiemVu nhung
 * ketQua duoc doi thanh du - da don sach, dung hinh dang, man hinh khong phai
 * tu doan JSON cua mo hinh nua.
 */
export type KetQuaStudio<T> = {
  trangThai: TrangThaiViec;
  du: T | null;
  loi: string | null;
  canhBao: string[];
  moHinh: string | null;
};

/** Ban nhap bai dang, sinh tu 1 y tuong o /studio/bien-soan - chua luu vao contents. */
export type BanNhapBai = {
  tieuDe: string;
  noiDung: string;
  hashtag: string[];
};

export type PhanCanh = {
  thoiLuongGiay: number;
  hinhAnh: string;
  loiThoai: string;
};

/** Ban nhap kich ban quay, sinh tu 1 y tuong - chua luu vao contents. */
export type BanNhapKichBan = {
  tieuDe: string;
  phanCanh: PhanCanh[];
};

/** Mot cot cua man /studio/so-giong - moi be mat sinh doc lap, hong be mat nao chi be mat do bao loi. */
export type CotSoGiong = {
  beMat: BeMat;
  trangThai: 'xong' | 'loi';
  banNhap: BanNhapBai | null;
  loi: string | null;
  moHinh: string | null;
};
