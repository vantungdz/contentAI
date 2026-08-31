import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { tachTieuDeTuLyDo } from '../y-tuong-hien-thi';
import { ManHinhSoGiong } from './man-hinh-so-giong';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import type { TruCot } from '@/lib/data-access/content-pillars';
import type { Idea } from '@/lib/data-access/ideas';
import type { ChanDung } from '@/lib/data-access/personas';
import '../../brand/brand.css';
import '../studio.css';
import '../../templates/content-templates-page.css';
import '../bien-soan/bien-soan.css';

export const metadata: Metadata = {
  title: 'So 4 giọng — AI Content',
};

const NHAN_BE_MAT: Record<string, string> = {
  fanpage: 'Fanpage',
  ho_so_ca_nhan: 'Trang cá nhân',
  tiktok: 'TikTok',
  zalo: 'Zalo',
};

export default async function TrangSoGiong({
  searchParams,
}: {
  searchParams: Promise<{ y?: string }>;
}) {
  const { y: ideaId } = await searchParams;
  const repo = createRepo(await workspaceHienTai());

  if (!ideaId) {
    const [yTuong, truCot, chanDung] = await Promise.all([
      repo.yTuong.list(),
      repo.truCot.list(),
      repo.chanDung.list(),
    ]);
    const tenTruCot = new Map((truCot as TruCot[]).map((t) => [t.id, t.ten]));
    const tenChanDung = new Map((chanDung as ChanDung[]).map((c) => [c.id, c.ten]));

    return (
      <>
        <div className="page-head">
          <div className="page-head__text">
            <span className="eyebrow">
              <Icon name="i-eye" size={13} />
              Studio nội dung
            </span>
            <h1 className="page-title">So 4 giọng</h1>
            <p className="page-sub">
              Chọn 1 ý tưởng, xem cùng nội dung viết theo giọng của cả 4 bề mặt cạnh nhau — bề
              mặt ở đây có thể khác bề mặt gốc của ý tưởng, đây là chỗ để thử.
            </p>
          </div>
        </div>

        <section className="panel" aria-label="Chọn ý tưởng để so giọng">
          {(yTuong as Idea[]).length === 0 ? (
            <div className="empty" data-visible="true">
              <div className="empty__icon">
                <Icon name="i-sparkle" size={26} />
              </div>
              <p className="empty__title">Chưa có ý tưởng nào</p>
              <p className="empty__sub">Sang Đề xuất hôm nay để sinh ý tưởng trước.</p>
              <Link className="btn btn--primary" href="/studio/de-xuat">
                Đề xuất hôm nay
              </Link>
            </div>
          ) : (
            <div className="grid">
              {(yTuong as Idea[]).map((y) => {
                const { tieuDe } = tachTieuDeTuLyDo(y.lyDoDeXuat);
                return (
                  <article key={y.id} className={`card card--${y.beMat}`}>
                    <div className="card__top">
                      <span className="badge">{NHAN_BE_MAT[y.beMat] ?? y.beMat}</span>
                    </div>
                    <h3 className="card__title">{tieuDe}</h3>
                    {y.gocTiepCan ? <p className="preview">{y.gocTiepCan}</p> : null}
                    <div className="card__foot">
                      <span className="pillar">
                        {(y.pillarId && tenTruCot.get(y.pillarId)) ?? 'chưa neo trụ cột'}
                      </span>
                      <span className="pillar">
                        {(y.personaId && tenChanDung.get(y.personaId)) ?? 'chưa neo chân dung'}
                      </span>
                    </div>
                    <div className="card__actions" style={{ marginTop: 10 }}>
                      <Link className="btn btn--primary btn--sm" href={`/studio/so-giong?y=${y.id}`}>
                        So 4 giọng
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }

  const y = await repo.yTuong.layTheoId(ideaId);
  if (!y) {
    return (
      <div className="chan chan--chan" role="alert">
        <p className="chan__tieu-de">
          <Icon name="i-alert" size={17} />
          Không tìm thấy ý tưởng này
        </p>
        <p className="chan__sub">
          Có thể ý tưởng đã bị xoá. <Link href="/studio/so-giong">Chọn ý tưởng khác</Link>.
        </p>
      </div>
    );
  }

  const { tieuDe } = tachTieuDeTuLyDo(y.lyDoDeXuat);

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Link href="/studio/so-giong">
              <Icon name="i-eye" size={13} />
              So 4 giọng
            </Link>
          </span>
          <h1 className="page-title">{tieuDe}</h1>
          <p className="page-sub">Cùng một ý tưởng, viết theo giọng của cả 4 bề mặt cạnh nhau.</p>
        </div>
      </div>

      <section className="panel" aria-label="So 4 giọng">
        <ManHinhSoGiong ideaId={y.id} />
      </section>
    </>
  );
}
