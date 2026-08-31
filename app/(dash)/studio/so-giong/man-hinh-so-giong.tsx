'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { luuCotSoGiong, soSanhGiongAction } from './actions';
import type { CotSoGiong } from '@/lib/studio/kieu';

const NHAN_BE_MAT: Record<string, string> = {
  fanpage: 'Fanpage',
  ho_so_ca_nhan: 'Trang cá nhân',
  tiktok: 'TikTok',
  zalo: 'Zalo',
};

export function ManHinhSoGiong({ ideaId }: { ideaId: string }) {
  const [cot, datCot] = useState<CotSoGiong[] | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangSinh, batDauSinh] = useTransition();

  function sinh() {
    datLoi(null);
    batDauSinh(async () => {
      const kq = await soSanhGiongAction(ideaId);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datCot(kq.cot);
    });
  }

  return (
    <div className="soan">
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      <button className="btn btn--primary" type="button" onClick={sinh} disabled={dangSinh}>
        <Icon name="i-sparkle" size={17} />
        {dangSinh ? 'Đang sinh cả 4 bề mặt…' : cot ? 'Sinh lại cả 4' : 'So 4 giọng'}
      </button>

      {cot ? (
        <div className="bon-cot">
          {cot.map((c) => (
            <CotGiong key={c.beMat} ideaId={ideaId} cot={c} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CotGiong({ ideaId, cot }: { ideaId: string; cot: CotSoGiong }) {
  const [daLuu, datDaLuu] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangLuu, batDauLuu] = useTransition();

  function luu() {
    if (!cot.banNhap) return;
    datLoi(null);
    batDauLuu(async () => {
      const kq = await luuCotSoGiong(ideaId, cot.beMat, cot.banNhap!, cot.moHinh);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datDaLuu(true);
    });
  }

  return (
    <div className="cot-be-mat">
      <div className="cot-be-mat__dau">
        <span className="cot-be-mat__ten">{NHAN_BE_MAT[cot.beMat] ?? cot.beMat}</span>
        {cot.moHinh ? <span className="cot-be-mat__the">Mô hình: {cot.moHinh}</span> : null}
      </div>

      {cot.trangThai === 'loi' ? (
        <p className="loi" role="alert">
          {cot.loi}
        </p>
      ) : cot.banNhap ? (
        <>
          <p className="cot-be-mat__tieu-de">{cot.banNhap.tieuDe}</p>
          <p className="cot-be-mat__than">{cot.banNhap.noiDung}</p>
          {cot.banNhap.hashtag.length > 0 ? (
            <p className="cot-be-mat__the">{cot.banNhap.hashtag.map((h) => `#${h}`).join(' ')}</p>
          ) : null}

          {loi ? (
            <p className="loi" role="alert">
              {loi}
            </p>
          ) : null}

          {daLuu ? (
            <p className="cot-be-mat__the">
              <Icon name="i-check" size={14} /> Đã lưu bản nháp
            </p>
          ) : (
            <button className="btn btn--ghost btn--sm" type="button" onClick={luu} disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : 'Lưu bài này'}
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}
