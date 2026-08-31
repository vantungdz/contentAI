import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { tachTieuDeTuLyDo } from '../y-tuong-hien-thi';
import { ManHinhBienSoan } from './man-hinh-bien-soan';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import type { TruCot } from '@/lib/data-access/content-pillars';
import type { Idea } from '@/lib/data-access/ideas';
import type { ChanDung } from '@/lib/data-access/personas';
import '../../brand/brand.css';
import '../studio.css';
import '../../templates/content-templates-page.css';
import './bien-soan.css';

export const metadata: Metadata = {
  title: 'Biên soạn — AI Content',
};

const NHAN_BE_MAT: Record<string, string> = {
  fanpage: 'Fanpage',
  ho_so_ca_nhan: 'Trang cá nhân',
  tiktok: 'TikTok',
  zalo: 'Zalo',
};

export default async function TrangBienSoan({
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
    const chuaDung = (yTuong as Idea[]).filter((y) => !y.daDung);

    return (
      <>
        <div className="page-head">
          <div className="page-head__text">
            <span className="eyebrow">
              <Icon name="i-text" size={13} />
              Studio nội dung
            </span>
            <h1 className="page-title">Biên soạn</h1>
            <p className="page-sub">
              Chọn một ý tưởng đã lưu ở Đề xuất hôm nay để soạn thành bài đăng hoàn chỉnh.
            </p>
          </div>
        </div>

        <section className="panel" aria-label="Ý tưởng chưa dùng">
          {chuaDung.length === 0 ? (
            <div className="empty" data-visible="true">
              <div className="empty__icon">
                <Icon name="i-sparkle" size={26} />
              </div>
              <p className="empty__title">Chưa có ý tưởng nào để soạn</p>
              <p className="empty__sub">
                Sang Đề xuất hôm nay để sinh ý tưởng trước, chọn ý ưng rồi quay lại đây.
              </p>
              <Link className="btn btn--primary" href="/studio/de-xuat">
                Đề xuất hôm nay
              </Link>
            </div>
          ) : (
            <div className="grid">
              {chuaDung.map((y) => {
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
                      <Link
                        className="btn btn--primary btn--sm"
                        href={`/studio/bien-soan?y=${y.id}`}
                      >
                        Biên soạn
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
          Có thể ý tưởng đã bị xoá. <Link href="/studio/bien-soan">Chọn ý tưởng khác</Link>.
        </p>
      </div>
    );
  }

  const [truCot, chanDung] = await Promise.all([
    y.pillarId ? repo.truCot.layTheoId(y.pillarId) : null,
    y.personaId ? repo.chanDung.layTheoId(y.personaId) : null,
  ]);
  const { tieuDe, lyDo } = tachTieuDeTuLyDo(y.lyDoDeXuat);

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Link href="/studio/bien-soan">
              <Icon name="i-text" size={13} />
              Biên soạn
            </Link>
          </span>
          <h1 className="page-title">{tieuDe}</h1>
          <p className="page-sub">
            Bề mặt <strong>{NHAN_BE_MAT[y.beMat] ?? y.beMat}</strong> — sinh bản nháp, sửa trực
            tiếp rồi mới lưu.
          </p>
        </div>
      </div>

      <div className="cot-doc">
        <section className="panel" aria-label="Ý tưởng gốc">
          <div className="xem-truoc__khoi">
            <h2 className="xem-truoc__tieu-de">Ý tưởng gốc</h2>
            <p className="o__goi-y">
              Trụ cột: {(truCot as TruCot | null)?.ten ?? 'chưa neo được'} · Chân dung:{' '}
              {(chanDung as ChanDung | null)?.ten ?? 'chưa neo được'}
            </p>
            {y.gocTiepCan ? (
              <p className="cot-be-mat__than">
                <strong>Góc tiếp cận:</strong> {y.gocTiepCan}
              </p>
            ) : null}
            {y.cauMoDau ? (
              <p className="cot-be-mat__than">
                <strong>Câu mở đầu gợi ý:</strong> {y.cauMoDau}
              </p>
            ) : null}
            {lyDo ? (
              <p className="cot-be-mat__than">
                <strong>Vì sao đề xuất:</strong> {lyDo}
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel" aria-label="Soạn bài">
          <ManHinhBienSoan ideaId={y.id} beMat={y.beMat} />
        </section>
      </div>
    </>
  );
}
