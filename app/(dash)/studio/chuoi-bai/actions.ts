'use server';

/**
 * Hanh dong cho man /studio/chuoi-bai.
 *
 * workspaceId luon doc tu workspaceHienTai(), khong nhan tu client.
 */

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import { ghepHashtag } from '@/lib/studio/bien-soan';
import { sinhBaiTrongChuoi } from '@/lib/studio/chuoi-bai';
import type { BanNhapBai } from '@/lib/studio/kieu';

export type KetQuaSinhChuoi =
  | { ok: true; banNhap: BanNhapBai; chuoiId: string; thuTu: number; moHinh: string | null }
  | { ok: false; loi: string };

export async function sinhBaiChuoiAction(ideaId: string, chuoiId?: string): Promise<KetQuaSinhChuoi> {
  const workspaceId = await workspaceHienTai();
  const ket = await sinhBaiTrongChuoi({ workspaceId, ideaId, chuoiId });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'Sinh nội dung không xong. Thử lại.' };
  }
  const { chuoiId: idDung, thuTu, ...banNhap } = ket.du;
  return { ok: true, banNhap, chuoiId: idDung, thuTu, moHinh: ket.moHinh };
}

export type KetQuaLuuChuoi = { ok: true; contentId: string } | { ok: false; loi: string };

export async function luuBaiChuoi(
  ideaId: string,
  chuoiId: string,
  thuTu: number,
  banNhap: BanNhapBai,
  moHinh: string | null,
): Promise<KetQuaLuuChuoi> {
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
    chuoiId,
    thuTuTrongChuoi: thuTu,
  });

  await repo.yTuong.sua(ideaId, { daDung: true });

  revalidatePath('/studio/chuoi-bai');
  revalidatePath('/bai-da-dang');
  return { ok: true, contentId: dong.id };
}
