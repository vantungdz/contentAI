'use server';

/**
 * Hanh dong cho man /studio/so-giong.
 *
 * workspaceId luon doc tu workspaceHienTai(), khong nhan tu client.
 */

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import { ghepHashtag } from '@/lib/studio/bien-soan';
import type { BanNhapBai, BeMat, CotSoGiong } from '@/lib/studio/kieu';
import { soSanhGiong } from '@/lib/studio/so-giong';

export type KetQuaSoSanh =
  | { ok: true; cot: CotSoGiong[] }
  | { ok: false; loi: string };

export async function soSanhGiongAction(ideaId: string): Promise<KetQuaSoSanh> {
  const workspaceId = await workspaceHienTai();
  const ket = await soSanhGiong({ workspaceId, ideaId });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'So sánh không xong. Thử lại.' };
  }
  return { ok: true, cot: ket.du };
}

export type KetQuaLuuCot = { ok: true; contentId: string } | { ok: false; loi: string };

/**
 * Luu MOT cot (mot be mat) thanh content that. Be mat cua ban dang xem co the
 * KHAC be mat goc cua y tuong - do la dung y cua man nay (thu giong khac xem
 * cai nao hop hon), nen truyen rieng thay vi lay tu y tuong.
 */
export async function luuCotSoGiong(
  ideaId: string,
  beMat: BeMat,
  banNhap: BanNhapBai,
  moHinh: string | null,
): Promise<KetQuaLuuCot> {
  const noiDung = banNhap.noiDung.trim();
  if (noiDung === '') return { ok: false, loi: 'Chưa có nội dung để lưu.' };

  const workspaceId = await workspaceHienTai();
  const repo = createRepo(workspaceId);

  const y = await repo.yTuong.layTheoId(ideaId);
  if (!y) return { ok: false, loi: 'Không tìm thấy ý tưởng này.' };

  const dong = await repo.contents.tao({
    ideaId: y.id,
    beMat,
    pillarId: y.pillarId,
    personaId: y.personaId,
    productId: y.productId,
    gocTiepCan: y.gocTiepCan,
    cauMoDau: y.cauMoDau,
    noiDung: ghepHashtag(noiDung, banNhap.hashtag),
    moHinhDaSinh: moHinh,
    nguonYTuong: y.nguonYTuong,
    trangThai: 'ban_nhap',
  });

  await repo.yTuong.sua(ideaId, { daDung: true });

  revalidatePath('/studio/so-giong');
  revalidatePath('/bai-da-dang');
  return { ok: true, contentId: dong.id };
}
