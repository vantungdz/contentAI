import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { tachTieuDeTuLyDo } from '../y-tuong-hien-thi';
import { ManHinhChuoiBai } from './man-hinh-chuoi-bai';
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
  title: 'Chuỗi bài — AI Content',
};

const NHAN_BE_MAT: Record<string, string> = {
  fanpage: 'Fanpage',
  ho_so_ca_nhan: 'Trang cá nhân',
  tiktok: 'TikTok',
  zalo: 'Zalo',
};

export default async function TrangChuoiBai({
  searchParams,
}: {
  searchParams: Promise<{ chuoi?: string; y?: string }>;
}) {
  const { chuoi: chuoiId, y: ideaId } = await searchParams;
  const repo = createRepo(await workspaceHienTai());

  // Chua chon chuoi nao: hien danh sach chuoi da co + loi mo dau chuoi moi.
  if (!chuoiId) {
    const [danhSachChuoi, yTuong, truCot, chanDung] = await Promise.all([
      repo.contents.danhSachChuoi(),
      repo.yTuong.list(),
      repo.truCot.list(),
      repo.chanDung.list(),
    ]);

    if (ideaId) {
      const y = (await repo.yTuong.layTheoId(ideaId)) as Idea | null;
      if (!y) return <KhongTimThayYTuong />;
      const { tieuDe } = tachTieuDeTuLyDo(y.lyDoDeXuat);
      return (
        <>
          <TieuDeTrang tieuDe={`Chuỗi mới: ${tieuDe}`} moTa="Sinh bài mở đầu, lưu xong sẽ mở khoá tiếp bài 2." />
          <div className="cot-doc">
            <section className="panel" aria-label="Soạn bài mở đầu">
              <ManHinhChuoiBai ideaId={y.id} beMat={y.beMat} />
            </section>
          </div>
        </>
      );
    }

    const tenTruCot = new Map((truCot as TruCot[]).map((t) => [t.id, t.ten]));
    const tenChanDung = new Map((chanDung as ChanDung[]).map((c) => [c.id, c.ten]));
    const chuaDung = (yTuong as Idea[]).filter((y) => !y.daDung);

    return (
      <>
        <TieuDeTrang
          tieuDe="Chuỗi bài"
          moTa="Nhiều bài nối tiếp một mạch, bài sau không lặp ý bài trước. Tiếp tục một chuỗi đã có hoặc bắt đầu chuỗi mới."
        />

        <section className="panel" aria-label="Chuỗi đã có" style={{ marginBottom: 20 }}>
          {danhSachChuoi.length === 0 ? (
            <p className="o__goi-y" style={{ padding: 16 }}>
              Chưa có chuỗi bài nào.
            </p>
          ) : (
            <div className="xem-truoc__khoi">
              {danhSachChuoi.map((c) => (
                <div className="xem-truoc__mon" key={c.chuoiId}>
                  <span className="cot-be-mat__the">Chuỗi {c.chuoiId?.slice(0, 8)} — {c.soBai} bài</span>
                  <div className="xem-truoc__bo">
                    <Link className="btn btn--ghost btn--sm" href={`/studio/chuoi-bai?chuoi=${c.chuoiId}`}>
                      Xem &amp; nối tiếp
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-label="Bắt đầu chuỗi mới">
          {chuaDung.length === 0 ? (
            <div className="empty" data-visible="true">
              <div className="empty__icon">
                <Icon name="i-sparkle" size={26} />
              </div>
              <p className="empty__title">Chưa có ý tưởng nào để mở chuỗi mới</p>
              <p className="empty__sub">Sang Đề xuất hôm nay để sinh ý tưởng trước.</p>
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
                      <span className="pillar">{(y.pillarId && tenTruCot.get(y.pillarId)) ?? 'chưa neo trụ cột'}</span>
                      <span className="pillar">{(y.personaId && tenChanDung.get(y.personaId)) ?? 'chưa neo chân dung'}</span>
                    </div>
                    <div className="card__actions" style={{ marginTop: 10 }}>
                      <Link className="btn btn--primary btn--sm" href={`/studio/chuoi-bai?y=${y.id}`}>
                        Bắt đầu chuỗi mới
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

  // Da chon mot chuoi: hien lich su bai truoc + (neu chon them y) khung soan bai tiep theo.
  const baiCu = await repo.contents.theoChuoi(chuoiId);
  if (baiCu.length === 0) {
    return <KhongTimThayChuoi />;
  }
  const beMatChuoi = baiCu[0].beMat;

  if (ideaId) {
    const y = (await repo.yTuong.layTheoId(ideaId)) as Idea | null;
    if (!y) return <KhongTimThayYTuong />;
    return (
      <>
        <TieuDeTrang tieuDe="Nối tiếp chuỗi bài" moTa={`Bài thứ ${baiCu.length + 1} trong chuỗi.`} />
        <div className="cot-doc">
          <LichSuChuoi baiCu={baiCu} />
          <section className="panel" aria-label="Soạn bài tiếp theo">
            <ManHinhChuoiBai ideaId={y.id} chuoiId={chuoiId} beMat={y.beMat} />
          </section>
        </div>
      </>
    );
  }

  const [yTuong, truCot, chanDung] = await Promise.all([
    repo.yTuong.list(),
    repo.truCot.list(),
    repo.chanDung.list(),
  ]);
  const tenTruCot = new Map((truCot as TruCot[]).map((t) => [t.id, t.ten]));
  const tenChanDung = new Map((chanDung as ChanDung[]).map((c) => [c.id, c.ten]));
  // Bai tiep theo trong cung chuoi phai dung be mat voi bai dau, giu chuoi nhat quan mot kenh.
  const chuaDung = (yTuong as Idea[]).filter((y) => !y.daDung && y.beMat === beMatChuoi);

  return (
    <>
      <TieuDeTrang
        tieuDe="Chọn ý tưởng để nối tiếp"
        moTa={`Chuỗi đã có ${baiCu.length} bài, bề mặt ${NHAN_BE_MAT[beMatChuoi] ?? beMatChuoi}.`}
      />
      <div className="cot-doc">
        <LichSuChuoi baiCu={baiCu} />
        <section className="panel" aria-label="Ý tưởng để nối tiếp">
          {chuaDung.length === 0 ? (
            <p className="o__goi-y" style={{ padding: 16 }}>
              Chưa có ý tưởng {NHAN_BE_MAT[beMatChuoi] ?? beMatChuoi} nào chưa dùng. Sang Đề xuất hôm nay để sinh
              thêm.
            </p>
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
                      <span className="pillar">{(y.pillarId && tenTruCot.get(y.pillarId)) ?? 'chưa neo trụ cột'}</span>
                      <span className="pillar">{(y.personaId && tenChanDung.get(y.personaId)) ?? 'chưa neo chân dung'}</span>
                    </div>
                    <div className="card__actions" style={{ marginTop: 10 }}>
                      <Link className="btn btn--primary btn--sm" href={`/studio/chuoi-bai?chuoi=${chuoiId}&y=${y.id}`}>
                        Soạn bài tiếp theo
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function TieuDeTrang({ tieuDe, moTa }: { tieuDe: string; moTa: string }) {
  return (
    <div className="page-head">
      <div className="page-head__text">
        <span className="eyebrow">
          <Link href="/studio/chuoi-bai">
            <Icon name="i-layers" size={13} />
            Chuỗi bài
          </Link>
        </span>
        <h1 className="page-title">{tieuDe}</h1>
        <p className="page-sub">{moTa}</p>
      </div>
    </div>
  );
}

function LichSuChuoi({
  baiCu,
}: {
  baiCu: { id: string; thuTuTrongChuoi: number | null; noiDung: string | null }[];
}) {
  return (
    <section className="panel" aria-label="Các bài trước trong chuỗi">
      <div className="xem-truoc__khoi">
        <h2 className="xem-truoc__tieu-de">Các bài trước trong chuỗi</h2>
        {baiCu.map((b) => (
          <div className="xem-truoc__mon" key={b.id}>
            <span className="cot-be-mat__the">Bài {b.thuTuTrongChuoi}</span>
            <p className="preview">{b.noiDung}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function KhongTimThayYTuong() {
  return (
    <div className="chan chan--chan" role="alert">
      <p className="chan__tieu-de">
        <Icon name="i-alert" size={17} />
        Không tìm thấy ý tưởng này
      </p>
      <p className="chan__sub">
        Có thể ý tưởng đã bị xoá. <Link href="/studio/chuoi-bai">Quay lại</Link>.
      </p>
    </div>
  );
}

function KhongTimThayChuoi() {
  return (
    <div className="chan chan--chan" role="alert">
      <p className="chan__tieu-de">
        <Icon name="i-alert" size={17} />
        Không tìm thấy chuỗi bài này
      </p>
      <p className="chan__sub">
        <Link href="/studio/chuoi-bai">Quay lại danh sách chuỗi</Link>.
      </p>
    </div>
  );
}
