/**
 * Doc 1 y tuong kem tru cot/chan dung/san pham lien ket - dung chung cho
 * bien-soan.ts va kich-ban.ts, ca hai deu can dung mot bo ngu canh nay truoc
 * khi goi mo hinh.
 */

import { createRepo } from '@/lib/data-access';
import type { TruCot } from '@/lib/data-access/content-pillars';
import type { Idea } from '@/lib/data-access/ideas';
import type { ChanDung } from '@/lib/data-access/personas';
import type { SanPham } from '@/lib/data-access/products';

export type NguCanhYTuong = {
  y: Idea;
  truCot: TruCot | null;
  chanDung: ChanDung | null;
  sanPham: SanPham | null;
};

export async function layNguCanhYTuong(
  workspaceId: string,
  ideaId: string,
): Promise<NguCanhYTuong | null> {
  const repo = createRepo(workspaceId);
  const y = (await repo.yTuong.layTheoId(ideaId)) as Idea | null;
  if (!y) return null;

  const [truCotTho, chanDungTho, sanPhamTho] = await Promise.all([
    y.pillarId ? repo.truCot.layTheoId(y.pillarId) : null,
    y.personaId ? repo.chanDung.layTheoId(y.personaId) : null,
    y.productId ? repo.sanPham.layTheoId(y.productId) : null,
  ]);

  return {
    y,
    truCot: truCotTho as TruCot | null,
    chanDung: chanDungTho as ChanDung | null,
    sanPham: sanPhamTho as SanPham | null,
  };
}

/** bienThe chon giong be mat trong loi nhac, bi rut ra truoc khi goi mo hinh. */
export function duLieuNguCanh(nguCanh: NguCanhYTuong): Record<string, unknown> {
  const { y, truCot, chanDung, sanPham } = nguCanh;
  return {
    gocTiepCan: y.gocTiepCan,
    cauMoDau: y.cauMoDau,
    lyDoDeXuat: y.lyDoDeXuat,
    truCot: truCot ? { ten: truCot.ten, mucDich: truCot.mucDich } : null,
    chanDung: chanDung
      ? {
          ten: chanDung.ten,
          doTuoi: chanDung.doTuoi,
          ngheNghiep: chanDung.ngheNghiep,
          noiDau: chanDung.noiDau,
          mongMuon: chanDung.mongMuon,
        }
      : null,
    sanPham: sanPham
      ? { ten: sanPham.ten, gia: sanPham.gia, loiIch: sanPham.loiIch, loiKeuGoi: sanPham.loiKeuGoi }
      : null,
    bienThe: y.beMat,
  };
}
