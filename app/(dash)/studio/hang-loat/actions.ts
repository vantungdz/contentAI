'use server';

/**
 * Hanh dong cho man /studio/hang-loat.
 *
 * workspaceId luon doc tu workspaceHienTai(), khong nhan tu client.
 */

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { sinhAnhChoBai } from '@/lib/studio/anh';
import { sinhVaLuuMotBai, type KetQuaMotBaiHangLoat } from '@/lib/studio/hang-loat';

/**
 * Sinh VA luu MOT bai. Man hinh goi ham nay tuan tu cho tung y tuong da chon,
 * de hien duoc thanh tien do va ket qua tang dan - khong doi ca lo xong moi
 * thay gi.
 */
export async function sinhHangLoatMotBai(ideaId: string): Promise<KetQuaMotBaiHangLoat> {
  const workspaceId = await workspaceHienTai();
  const ket = await sinhVaLuuMotBai(workspaceId, ideaId);
  revalidatePath('/studio/hang-loat');
  revalidatePath('/studio/bien-soan');
  return ket;
}

export type KetQuaSinhAnhHangLoat = { ok: true; duongDan: string } | { ok: false; loi: string };

export async function sinhAnhHangLoat(contentId: string): Promise<KetQuaSinhAnhHangLoat> {
  const workspaceId = await workspaceHienTai();
  const ket = await sinhAnhChoBai({ workspaceId, contentId });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'Sinh ảnh không xong. Thử lại.' };
  }
  return { ok: true, duongDan: ket.du.duongDan };
}
