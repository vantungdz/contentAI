import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { tachTieuDeTuLyDo } from '../y-tuong-hien-thi';
import { ManHinhHangLoat } from './man-hinh-hang-loat';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import type { TruCot } from '@/lib/data-access/content-pillars';
import type { Idea } from '@/lib/data-access/ideas';
import type { ChanDung } from '@/lib/data-access/personas';
import '../../brand/brand.css';
import '../studio.css';
import '../../templates/content-templates-page.css';

export const metadata: Metadata = {
  title: 'Sinh hàng loạt — AI Content',
};

export default async function TrangHangLoat() {
  const repo = createRepo(await workspaceHienTai());
  const [yTuong, truCot, chanDung] = await Promise.all([
    repo.yTuong.list(),
    repo.truCot.list(),
    repo.chanDung.list(),
  ]);

  const tenTruCot = new Map((truCot as TruCot[]).map((t) => [t.id, t.ten]));
  const tenChanDung = new Map((chanDung as ChanDung[]).map((c) => [c.id, c.ten]));
  const chuaDung = (yTuong as Idea[])
    .filter((y) => !y.daDung)
    .map((y) => {
      const { tieuDe } = tachTieuDeTuLyDo(y.lyDoDeXuat);
      return {
        id: y.id,
        tieuDe,
        beMat: y.beMat,
        truCot: (y.pillarId && tenTruCot.get(y.pillarId)) ?? null,
        chanDung: (y.personaId && tenChanDung.get(y.personaId)) ?? null,
      };
    });

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-copy" size={13} />
            Studio nội dung
          </span>
          <h1 className="page-title">Sinh hàng loạt</h1>
          <p className="page-sub">
            Chọn nhiều ý tưởng đã lưu, sinh và lưu bài đăng cho từng ý tưởng một lượt —
            phục vụ mục tiêu 10 bài/ngày. 
          </p>
        </div>
      </div>

      <section className="panel" aria-label="Sinh hàng loạt">
        {chuaDung.length === 0 ? (
          <div className="empty" data-visible="true">
            <div className="empty__icon">
              <Icon name="i-sparkle" size={26} />
            </div>
            <p className="empty__title">Chưa có ý tưởng nào để sinh hàng loạt</p>
            <p className="empty__sub">
              Sang Đề xuất hôm nay để sinh một loạt ý tưởng, chọn ý ưng rồi quay lại đây.
            </p>
            <Link className="btn btn--primary" href="/studio/de-xuat">
              Đề xuất hôm nay
            </Link>
          </div>
        ) : (
          <ManHinhHangLoat danhSach={chuaDung} />
        )}
      </section>
    </>
  );
}
