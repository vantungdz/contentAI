'use server';

/**
 * Hanh dong cho man /studio/de-xuat.
 *
 * workspaceId luon doc tu workspaceHienTai(), khong nhan tu client - giong
 * cach cac man khac dang lam.
 */

import { revalidatePath } from 'next/cache';

import { kiemTraDeXuat } from '@/lib/brand/do-day-du';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import type { TruCot } from '@/lib/data-access/content-pillars';
import type { ChanDung } from '@/lib/data-access/personas';
import { deXuatYTuong } from '@/lib/studio/de-xuat';
import type { BeMat, YTuongDeXuat } from '@/lib/studio/kieu';

export type KetQuaSinh =
  | { ok: true; yTuong: YTuongDeXuat[] }
  | { ok: false; loi: string };

/** Chan truoc neu ho so chua du day du roi moi sinh y tuong. */
export async function sinhYTuongHomNay(beMat: BeMat, soLuong: number): Promise<KetQuaSinh> {
  const workspaceId = await workspaceHienTai();
  const repo = createRepo(workspaceId);

  const [truCot, chanDung, sanPham, insight, hoSo] = await Promise.all([
    repo.truCot.list(),
    repo.chanDung.list(),
    repo.sanPham.list(),
    repo.insight.list(),
    repo.hoSo.lay(),
  ]);

  const kiem = kiemTraDeXuat({ truCot, chanDung, sanPham, insight, hoSo });
  if (!kiem.duocPhep) {
    return { ok: false, loi: kiem.lyDo ?? 'Hồ sơ chưa đủ để đề xuất.' };
  }

  const ket = await deXuatYTuong({ workspaceId, beMat, soLuong });
  if (ket.trangThai !== 'xong' || !ket.du) {
    return { ok: false, loi: ket.loi ?? 'Đề xuất ý tưởng không xong. Thử lại.' };
  }
  if (ket.du.length === 0) {
    return { ok: false, loi: 'Mô hình không trả về ý tưởng nào dùng được. Thử lại.' };
  }
  return { ok: true, yTuong: ket.du };
}

export type KetQuaLuuYTuong = { ok: true; soLuu: number } | { ok: false; loi: string };

/**
 * Luu y tuong da chon vao bang ideas.
 *
 * truCot/chanDung la ten, phai tra lai danh sach cua chinh workspace de doi
 * sang pillarId/personaId - khong tin id nao gui tu client len.
 *
 * ideas khong co cot tieu de, nen ghep tieuDe vao dau lyDoDeXuat cho khoi mat.
 */
export async function luuYTuongDaChon(danhSach: YTuongDeXuat[]): Promise<KetQuaLuuYTuong> {
  if (danhSach.length === 0) return { ok: false, loi: 'Chưa chọn ý tưởng nào để lưu.' };

  const workspaceId = await workspaceHienTai();
  const repo = createRepo(workspaceId);

  const [truCot, chanDung]: [TruCot[], ChanDung[]] = await Promise.all([
    repo.truCot.list(),
    repo.chanDung.list(),
  ]);
  const idTheoTenTruCot = new Map(truCot.map((t) => [t.ten, t.id]));
  const idTheoTenChanDung = new Map(chanDung.map((c) => [c.ten, c.id]));

  let soLuu = 0;
  for (const y of danhSach) {
    await repo.yTuong.tao({
      beMat: y.beMat,
      gocTiepCan: y.gocTiepCan,
      pillarId: y.truCot ? (idTheoTenTruCot.get(y.truCot) ?? null) : null,
      personaId: y.chanDung ? (idTheoTenChanDung.get(y.chanDung) ?? null) : null,
      cauMoDau: y.cauMoDau,
      lyDoDeXuat: [y.tieuDe, y.lyDoDeXuat].filter((p) => p && p.trim() !== '').join(' — ') || null,
      nguonYTuong: 'may-de-xuat',
    });
    soLuu += 1;
  }

  revalidatePath('/studio/de-xuat');
  return { ok: true, soLuu };
}
