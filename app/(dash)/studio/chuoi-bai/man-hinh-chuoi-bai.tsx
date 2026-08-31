'use client';

import { useMemo, useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { luuBaiChuoi, sinhBaiChuoiAction } from './actions';
import { kiemDoDai } from '@/lib/studio/cong-dem-tu';
import type { BanNhapBai, BeMat } from '@/lib/studio/kieu';

const NHAN_TRANG_THAI: Record<'dat' | 'ngan' | 'dai', string> = {
  dat: 'Đạt độ dài',
  ngan: 'Ngắn hơn mức cần',
  dai: 'Dài hơn mức cho phép',
};

export function ManHinhChuoiBai({
  ideaId,
  chuoiId,
  beMat,
}: {
  ideaId: string;
  chuoiId?: string;
  beMat: BeMat;
}) {
  const [banNhap, datBanNhap] = useState<BanNhapBai | null>(null);
  const [hashtagTho, datHashtagTho] = useState('');
  const [moHinh, datMoHinh] = useState<string | null>(null);
  const [idChuoi, datIdChuoi] = useState<string | null>(null);
  const [thuTu, datThuTu] = useState<number | null>(null);
  const [daLuu, datDaLuu] = useState<{ contentId: string; chuoiId: string } | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangSinh, batDauSinh] = useTransition();
  const [dangLuu, batDauLuu] = useTransition();

  const doDai = useMemo(
    () => (banNhap ? kiemDoDai(beMat, banNhap.noiDung) : null),
    [beMat, banNhap],
  );

  function sinh() {
    datLoi(null);
    batDauSinh(async () => {
      const kq = await sinhBaiChuoiAction(ideaId, chuoiId);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datBanNhap(kq.banNhap);
      datHashtagTho(kq.banNhap.hashtag.join(' '));
      datMoHinh(kq.moHinh);
      datIdChuoi(kq.chuoiId);
      datThuTu(kq.thuTu);
    });
  }

  function luu() {
    if (!banNhap || !idChuoi || thuTu === null) return;
    const hashtag = hashtagTho.split(/\s+/).filter((h) => h.trim() !== '');
    datLoi(null);
    batDauLuu(async () => {
      const kq = await luuBaiChuoi(ideaId, idChuoi, thuTu, { ...banNhap, hashtag }, moHinh);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datDaLuu({ contentId: kq.contentId, chuoiId: idChuoi });
    });
  }

  if (daLuu) {
    return (
      <div className="soan">
        <div className="chan chan--mo" role="status">
          <p className="chan__tieu-de">
            <Icon name="i-check" size={17} />
            Đã lưu bài {thuTu} trong chuỗi
          </p>
          <p className="chan__sub">
            Bài đang ở trạng thái bản nháp. Mở{' '}
            <a href={`/studio/chuoi-bai?chuoi=${daLuu.chuoiId}`}>tiếp chuỗi này</a> để thêm bài
            tiếp theo, hoặc <a href="/studio/chuoi-bai">chọn chuỗi khác</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="soan">
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      {!banNhap ? (
        <button className="btn btn--primary" type="button" onClick={sinh} disabled={dangSinh}>
          <Icon name="i-sparkle" size={17} />
          {dangSinh ? 'Đang soạn…' : chuoiId ? 'Sinh bài tiếp theo' : 'Sinh bài mở đầu chuỗi'}
        </button>
      ) : (
        <>
          <div className="o">
            <label className="o__nhan" htmlFor="cb-tieu-de">
              Tiêu đề
            </label>
            <input
              id="cb-tieu-de"
              type="text"
              value={banNhap.tieuDe}
              onChange={(e) => datBanNhap({ ...banNhap, tieuDe: e.target.value })}
            />
          </div>

          <div className="o">
            <label className="o__nhan" htmlFor="cb-noi-dung">
              Nội dung
            </label>
            <textarea
              id="cb-noi-dung"
              className="soan__o"
              value={banNhap.noiDung}
              onChange={(e) => datBanNhap({ ...banNhap, noiDung: e.target.value })}
            />
          </div>

          {doDai ? (
            <div className="soan__do">
              <span className={`soan__dem--${doDai.trangThai}`}>{doDai.soTu} từ</span>
              <span className="soan__lech">
                {NHAN_TRANG_THAI[doDai.trangThai]} (cần {doDai.toiThieu}–{doDai.toiDa})
              </span>
            </div>
          ) : null}

          <div className="o">
            <label className="o__nhan" htmlFor="cb-hashtag">
              Hashtag
            </label>
            <input
              id="cb-hashtag"
              type="text"
              value={hashtagTho}
              onChange={(e) => datHashtagTho(e.target.value)}
              placeholder="#vidu #tuvancungshop"
            />
            <p className="o__goi-y">Cách nhau bằng khoảng trắng, lưu sẽ nối vào cuối bài.</p>
          </div>

          <div className="bieu-mau__nut">
            <button className="btn btn--primary" type="button" onClick={luu} disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : `Lưu bài ${thuTu} vào chuỗi`}
            </button>
            <button className="btn btn--ghost" type="button" onClick={sinh} disabled={dangSinh || dangLuu}>
              {dangSinh ? 'Đang soạn lại…' : 'Sinh lại'}
            </button>
            {moHinh ? <span className="ghi-chu-mo-hinh">Mô hình: {moHinh}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}
