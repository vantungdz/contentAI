/**
 * Sinh hang loat bai dang tu nhieu y tuong da luu - moc 4, phuc vu muc tieu 10
 * bai/ngay.
 *
 * Khac /studio/bien-soan: KHONG dung o buoc xem-sua-roi-luu. Hang loat sinh
 * thang ra ban nhap va luu luon, roi de nguoi dung xem lai sau - duyet tung
 * bai truoc khi luu thi mat het loi ich cua "hang loat".
 */

import { createRepo } from '@/lib/data-access';

import { bienSoanBai, ghepHashtag } from './bien-soan';

export type KetQuaMotBaiHangLoat = {
  ideaId: string;
  ok: boolean;
  contentId: string | null;
  tieuDe: string | null;
  noiDung: string | null;
  loi: string | null;
};

export async function sinhVaLuuMotBai(
  workspaceId: string,
  ideaId: string,
): Promise<KetQuaMotBaiHangLoat> {
  const ket = await bienSoanBai({ workspaceId, ideaId });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return {
      ideaId,
      ok: false,
      contentId: null,
      tieuDe: null,
      noiDung: null,
      loi: ket.loi ?? 'Sinh nội dung không xong.',
    };
  }

  const repo = createRepo(workspaceId);
  const y = await repo.yTuong.layTheoId(ideaId);
  if (!y) {
    return {
      ideaId,
      ok: false,
      contentId: null,
      tieuDe: null,
      noiDung: null,
      loi: 'Không tìm thấy ý tưởng này.',
    };
  }

  const noiDungDayDu = ghepHashtag(ket.du.noiDung, ket.du.hashtag);
  const dong = await repo.contents.tao({
    ideaId: y.id,
    beMat: y.beMat,
    pillarId: y.pillarId,
    personaId: y.personaId,
    productId: y.productId,
    gocTiepCan: y.gocTiepCan,
    cauMoDau: y.cauMoDau,
    noiDung: noiDungDayDu,
    moHinhDaSinh: ket.moHinh,
    nguonYTuong: y.nguonYTuong,
    trangThai: 'ban_nhap',
  });
  await repo.yTuong.sua(ideaId, { daDung: true });

  return {
    ideaId,
    ok: true,
    contentId: dong.id,
    tieuDe: ket.du.tieuDe,
    noiDung: noiDungDayDu,
    loi: null,
  };
}
