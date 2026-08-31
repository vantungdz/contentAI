/**
 * Dem tu va kiem do dai theo be mat.
 *
 * File rieng vi phai chay duoc o trinh duyet (man soan bai dem tu ngay khi go),
 * nen KHONG import tu boc-cong-thuc.ts hay bat ky gi keo theo @/db - xem ghi
 * chu trong khoang-tu-be-mat.js ve ly do file do cung tach rieng.
 */

import { KHOANG_TU_BE_MAT } from '@/lib/model-runner/khoang-tu-be-mat';

import type { BeMat } from './kieu';

export function demTu(vanBan: string): number {
  const sach = vanBan.trim();
  return sach === '' ? 0 : sach.split(/\s+/).length;
}

export type TrangThaiDoDai = 'dat' | 'ngan' | 'dai';

export type KetQuaDoDai = {
  soTu: number;
  toiThieu: number;
  toiDa: number;
  trangThai: TrangThaiDoDai;
};

export function kiemDoDai(beMat: BeMat, vanBan: string): KetQuaDoDai {
  const { toiThieu, toiDa } = KHOANG_TU_BE_MAT[beMat];
  const soTu = demTu(vanBan);
  const trangThai: TrangThaiDoDai = soTu < toiThieu ? 'ngan' : soTu > toiDa ? 'dai' : 'dat';
  return { soTu, toiThieu, toiDa, trangThai };
}
