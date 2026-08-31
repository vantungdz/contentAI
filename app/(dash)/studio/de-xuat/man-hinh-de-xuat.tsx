'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { luuYTuongDaChon, sinhYTuongHomNay } from './actions';
import type { BeMat, YTuongDeXuat } from '@/lib/studio/kieu';

const BE_MAT: { gia: BeMat; nhan: string; icon: string }[] = [
  { gia: 'fanpage', nhan: 'Fanpage', icon: 'i-layers' },
  { gia: 'ho_so_ca_nhan', nhan: 'Trang cá nhân', icon: 'i-person' },
  { gia: 'tiktok', nhan: 'TikTok', icon: 'i-film' },
  { gia: 'zalo', nhan: 'Zalo', icon: 'i-text' },
];

const NHAN_BE_MAT: Record<BeMat, string> = {
  fanpage: 'Fanpage',
  ho_so_ca_nhan: 'Trang cá nhân',
  tiktok: 'TikTok',
  zalo: 'Zalo',
};

export function ManHinhDeXuat({
  kiemTraBanDau,
}: {
  kiemTraBanDau: { duocPhep: boolean; phanTram: number; lyDo: string | null };
}) {
  const [beMat, datBeMat] = useState<BeMat>('fanpage');
  const [soLuong, datSoLuong] = useState(5);
  const [yTuong, datYTuong] = useState<YTuongDeXuat[] | null>(null);
  const [daChon, datDaChon] = useState<Set<number>>(new Set());
  const [loi, datLoi] = useState<string | null>(null);
  const [thongBao, datThongBao] = useState<string | null>(null);
  const [dangSinh, batDauSinh] = useTransition();
  const [dangLuu, batDauLuu] = useTransition();

  function sinh() {
    datLoi(null);
    datThongBao(null);
    batDauSinh(async () => {
      const kq = await sinhYTuongHomNay(beMat, soLuong);
      if (!kq.ok) {
        datLoi(kq.loi);
        datYTuong(null);
        return;
      }
      datYTuong(kq.yTuong);
      // mac dinh chon het, bo bot con hon tick tay tu dau
      datDaChon(new Set(kq.yTuong.map((_, i) => i)));
    });
  }

  function bat(chiSo: number) {
    const moi = new Set(daChon);
    if (moi.has(chiSo)) moi.delete(chiSo);
    else moi.add(chiSo);
    datDaChon(moi);
  }

  function luu() {
    if (!yTuong) return;
    const chon = yTuong.filter((_, i) => daChon.has(i));
    if (chon.length === 0) {
      datLoi('Chưa chọn ý tưởng nào để lưu.');
      return;
    }
    datLoi(null);
    batDauLuu(async () => {
      const kq = await luuYTuongDaChon(chon);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datThongBao(`Đã lưu ${kq.soLuu} ý tưởng.`);
      datYTuong(null);
      datDaChon(new Set());
    });
  }

  return (
    <>
      {!kiemTraBanDau.duocPhep ? (
        <div className="chan chan--chan" role="alert" style={{ margin: 16 }}>
          <p className="chan__tieu-de">
            <Icon name="i-alert" size={17} />
            Hồ sơ chưa đủ để đề xuất ({kiemTraBanDau.phanTram}%)
          </p>
          <p className="chan__sub">
            {kiemTraBanDau.lyDo} <a href="/brand">Bổ sung hồ sơ thương hiệu</a> rồi quay lại đây.
          </p>
        </div>
      ) : null}

      {loi ? (
        <p className="loi" role="alert" style={{ margin: 16 }}>
          {loi}
        </p>
      ) : null}
      {thongBao ? (
        <p className="chan chan--mo" role="status" style={{ margin: 16 }}>
          <Icon name="i-check" size={17} /> {thongBao}
        </p>
      ) : null}

      <div className="toolbar toolbar--de-xuat">
        {BE_MAT.map((b) => (
          <button
            key={b.gia}
            type="button"
            className="chip"
            aria-pressed={beMat === b.gia}
            onClick={() => datBeMat(b.gia)}
            disabled={!kiemTraBanDau.duocPhep || dangSinh}
          >
            <Icon name={b.icon} size={15} />
            {b.nhan}
          </button>
        ))}

        <label className="dem-so-luong">
          Số lượng
          <input
            type="number"
            min={1}
            max={20}
            value={soLuong}
            onChange={(e) => datSoLuong(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            disabled={!kiemTraBanDau.duocPhep || dangSinh}
          />
        </label>

        <button
          className="btn btn--primary btn--sm"
          type="button"
          onClick={sinh}
          disabled={!kiemTraBanDau.duocPhep || dangSinh}
          style={{ marginLeft: 'auto' }}
        >
          <Icon name="i-sparkle" size={16} />
          {dangSinh ? 'Đang đề xuất…' : 'Đề xuất hôm nay'}
        </button>
      </div>

      {yTuong && yTuong.length > 0 ? (
        <>
          <div className="grid">
            {yTuong.map((y, chiSo) => {
              const chon = daChon.has(chiSo);
              return (
                <article
                  key={chiSo}
                  className={`card card--y-tuong card--${y.beMat}${chon ? ' card--chon' : ''}`}
                  onClick={() => bat(chiSo)}
                  aria-pressed={chon}
                >
                  <div className="card__top">
                    <input
                      className="card__check"
                      type="checkbox"
                      checked={chon}
                      onChange={() => bat(chiSo)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Chọn ý tưởng "${y.tieuDe}"`}
                    />
                    <span className="badge">{NHAN_BE_MAT[y.beMat]}</span>
                    {y.khamPha ? <span className="badge badge--kham-pha">Khám phá</span> : null}
                  </div>

                  <h3 className="card__title">{y.tieuDe}</h3>

                  {y.gocTiepCan || y.cauMoDau ? (
                    <p className="preview">
                      {y.gocTiepCan}
                      {y.gocTiepCan && y.cauMoDau ? <br /> : null}
                      {y.cauMoDau ? <>“{y.cauMoDau}”</> : null}
                    </p>
                  ) : null}

                  {y.lyDoDeXuat ? <p className="card__ly-do">Vì sao: {y.lyDoDeXuat}</p> : null}

                  <div className="card__foot">
                    <span className="pillar">{y.truCot ?? 'Chưa neo được trụ cột'}</span>
                    <span className="pillar">{y.chanDung ?? 'chưa neo được chân dung'}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="luu-y-tuong">
            <button className="btn btn--primary" type="button" onClick={luu} disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : `Lưu ${daChon.size} ý tưởng đã chọn`}
            </button>
            <span className="count">{daChon.size}/{yTuong.length} đã chọn</span>
          </div>
        </>
      ) : null}
    </>
  );
}
