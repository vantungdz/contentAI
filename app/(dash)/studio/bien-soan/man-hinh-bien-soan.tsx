'use client';

import { useMemo, useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import {
  luuKichBan,
  luuNoiDung,
  sinhAnhAction,
  sinhBanNhap,
  sinhKichBanAction,
} from './actions';
import { kiemDoDai } from '@/lib/studio/cong-dem-tu';
import type { BanNhapBai, BanNhapKichBan, BeMat, PhanCanh } from '@/lib/studio/kieu';

const NHAN_TRANG_THAI: Record<'dat' | 'ngan' | 'dai', string> = {
  dat: 'Đạt độ dài',
  ngan: 'Ngắn hơn mức cần',
  dai: 'Dài hơn mức cho phép',
};

type CheDo = 'bai-dang' | 'kich-ban';

type DaLuu = { cheDo: CheDo; contentId: string };

export function ManHinhBienSoan({ ideaId, beMat }: { ideaId: string; beMat: BeMat }) {
  const [cheDo, datCheDo] = useState<CheDo>('bai-dang');
  const [daLuu, datDaLuu] = useState<DaLuu | null>(null);
  // Zalo la tin nhan ca nhan, khong phai dinh dang video - khong co kich ban quay.
  const coKichBan = beMat !== 'zalo';

  if (daLuu) {
    return (
      <div className="soan">
        <div className="chan chan--mo" role="status">
          <p className="chan__tieu-de">
            <Icon name="i-check" size={17} />
            {daLuu.cheDo === 'bai-dang' ? 'Đã lưu bài đăng' : 'Đã lưu kịch bản'}
          </p>
          <p className="chan__sub">
            Bài đang ở trạng thái bản nháp. Mở <a href="/bai-da-dang">Bài đã đăng</a> để xem, hoặc{' '}
            <a href="/studio/bien-soan">chọn ý tưởng khác</a> để soạn tiếp.
          </p>
        </div>
        <SinhAnhChoBai contentId={daLuu.contentId} />
      </div>
    );
  }

  return (
    <div className="soan">
      <div className="chon-be-mat" role="tablist" aria-label="Chọn kiểu soạn">
        <button
          type="button"
          className={`btn btn--sm ${cheDo === 'bai-dang' ? 'btn--primary' : 'btn--ghost'}`}
          role="tab"
          aria-selected={cheDo === 'bai-dang'}
          onClick={() => datCheDo('bai-dang')}
        >
          <Icon name="i-text" size={15} />
          Bài đăng
        </button>
        {coKichBan ? (
          <button
            type="button"
            className={`btn btn--sm ${cheDo === 'kich-ban' ? 'btn--primary' : 'btn--ghost'}`}
            role="tab"
            aria-selected={cheDo === 'kich-ban'}
            onClick={() => datCheDo('kich-ban')}
          >
            <Icon name="i-film" size={15} />
            Kịch bản quay
          </button>
        ) : null}
      </div>
      {!coKichBan ? (
        <p className="o__goi-y">Zalo là tin nhắn cá nhân, không có kịch bản quay.</p>
      ) : null}

      {cheDo === 'bai-dang' || !coKichBan ? (
        <KhungBaiDang
          ideaId={ideaId}
          beMat={beMat}
          onDaLuu={(contentId) => datDaLuu({ cheDo: 'bai-dang', contentId })}
        />
      ) : (
        <KhungKichBan
          ideaId={ideaId}
          onDaLuu={(contentId) => datDaLuu({ cheDo: 'kich-ban', contentId })}
        />
      )}
    </div>
  );
}

function KhungBaiDang({
  ideaId,
  beMat,
  onDaLuu,
}: {
  ideaId: string;
  beMat: BeMat;
  onDaLuu: (contentId: string) => void;
}) {
  const [banNhap, datBanNhap] = useState<BanNhapBai | null>(null);
  const [hashtagTho, datHashtagTho] = useState('');
  const [moHinh, datMoHinh] = useState<string | null>(null);
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
      const kq = await sinhBanNhap(ideaId);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datBanNhap(kq.banNhap);
      datHashtagTho(kq.banNhap.hashtag.join(' '));
      datMoHinh(kq.moHinh);
    });
  }

  function luu() {
    if (!banNhap) return;
    const hashtag = hashtagTho.split(/\s+/).filter((h) => h.trim() !== '');
    datLoi(null);
    batDauLuu(async () => {
      const kq = await luuNoiDung(ideaId, { ...banNhap, hashtag }, moHinh);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      onDaLuu(kq.contentId);
    });
  }

  return (
    <>
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      {!banNhap ? (
        <button className="btn btn--primary" type="button" onClick={sinh} disabled={dangSinh}>
          <Icon name="i-sparkle" size={17} />
          {dangSinh ? 'Đang soạn…' : 'Sinh bản nháp'}
        </button>
      ) : (
        <>
          <div className="o">
            <label className="o__nhan" htmlFor="bs-tieu-de">
              Tiêu đề
            </label>
            <input
              id="bs-tieu-de"
              type="text"
              value={banNhap.tieuDe}
              onChange={(e) => datBanNhap({ ...banNhap, tieuDe: e.target.value })}
            />
          </div>

          <div className="o">
            <label className="o__nhan" htmlFor="bs-noi-dung">
              Nội dung
            </label>
            <textarea
              id="bs-noi-dung"
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
            <label className="o__nhan" htmlFor="bs-hashtag">
              Hashtag
            </label>
            <input
              id="bs-hashtag"
              type="text"
              value={hashtagTho}
              onChange={(e) => datHashtagTho(e.target.value)}
              placeholder="#vidu #tuvancungshop"
            />
            <p className="o__goi-y">Cách nhau bằng khoảng trắng, lưu sẽ nối vào cuối bài.</p>
          </div>

          <div className="bieu-mau__nut">
            <button className="btn btn--primary" type="button" onClick={luu} disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : 'Lưu bài đăng'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={sinh} disabled={dangSinh || dangLuu}>
              {dangSinh ? 'Đang soạn lại…' : 'Sinh lại'}
            </button>
            {moHinh ? <span className="ghi-chu-mo-hinh">Mô hình: {moHinh}</span> : null}
          </div>
        </>
      )}
    </>
  );
}

function KhungKichBan({
  ideaId,
  onDaLuu,
}: {
  ideaId: string;
  onDaLuu: (contentId: string) => void;
}) {
  const [banNhap, datBanNhap] = useState<BanNhapKichBan | null>(null);
  const [moHinh, datMoHinh] = useState<string | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangSinh, batDauSinh] = useTransition();
  const [dangLuu, batDauLuu] = useTransition();

  const tongGiay = useMemo(
    () => (banNhap ? banNhap.phanCanh.reduce((tong, c) => tong + c.thoiLuongGiay, 0) : 0),
    [banNhap],
  );

  function sinh() {
    datLoi(null);
    batDauSinh(async () => {
      const kq = await sinhKichBanAction(ideaId);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datBanNhap(kq.banNhap);
      datMoHinh(kq.moHinh);
    });
  }

  function suaCanh(chiSo: number, thayDoi: Partial<PhanCanh>) {
    if (!banNhap) return;
    const phanCanh = [...banNhap.phanCanh];
    phanCanh[chiSo] = { ...phanCanh[chiSo], ...thayDoi };
    datBanNhap({ ...banNhap, phanCanh });
  }

  function boCanh(chiSo: number) {
    if (!banNhap) return;
    datBanNhap({ ...banNhap, phanCanh: banNhap.phanCanh.filter((_, i) => i !== chiSo) });
  }

  function themCanh() {
    if (!banNhap) return;
    datBanNhap({
      ...banNhap,
      phanCanh: [...banNhap.phanCanh, { thoiLuongGiay: 5, hinhAnh: '', loiThoai: '' }],
    });
  }

  function luu() {
    if (!banNhap) return;
    datLoi(null);
    batDauLuu(async () => {
      const kq = await luuKichBan(ideaId, banNhap, moHinh);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      onDaLuu(kq.contentId);
    });
  }

  return (
    <>
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      {!banNhap ? (
        <button className="btn btn--primary" type="button" onClick={sinh} disabled={dangSinh}>
          <Icon name="i-sparkle" size={17} />
          {dangSinh ? 'Đang soạn…' : 'Sinh kịch bản'}
        </button>
      ) : (
        <>
          <div className="o">
            <label className="o__nhan" htmlFor="kb-tieu-de">
              Tiêu đề video
            </label>
            <input
              id="kb-tieu-de"
              type="text"
              value={banNhap.tieuDe}
              onChange={(e) => datBanNhap({ ...banNhap, tieuDe: e.target.value })}
            />
          </div>

          <div className="xem-truoc__khoi">
            <h2 className="xem-truoc__tieu-de">
              Phân cảnh
              <span className="xem-truoc__dem">{banNhap.phanCanh.length} cảnh · {tongGiay}s</span>
            </h2>

            {banNhap.phanCanh.map((canh, chiSo) => (
              <div className="xem-truoc__mon" key={chiSo}>
                <div className="o">
                  <label className="o__nhan" htmlFor={`kb-giay-${chiSo}`}>
                    Cảnh {chiSo + 1} — số giây
                  </label>
                  <input
                    id={`kb-giay-${chiSo}`}
                    type="number"
                    min={1}
                    value={canh.thoiLuongGiay}
                    onChange={(e) =>
                      suaCanh(chiSo, { thoiLuongGiay: Math.max(1, Number(e.target.value) || 1) })
                    }
                    style={{ width: 80 }}
                  />
                </div>
                <div className="o">
                  <label className="o__nhan" htmlFor={`kb-hinh-${chiSo}`}>
                    Hình ảnh
                  </label>
                  <textarea
                    id={`kb-hinh-${chiSo}`}
                    value={canh.hinhAnh}
                    onChange={(e) => suaCanh(chiSo, { hinhAnh: e.target.value })}
                  />
                </div>
                <div className="o">
                  <label className="o__nhan" htmlFor={`kb-loi-${chiSo}`}>
                    Lời thoại
                  </label>
                  <textarea
                    id={`kb-loi-${chiSo}`}
                    value={canh.loiThoai}
                    onChange={(e) => suaCanh(chiSo, { loiThoai: e.target.value })}
                  />
                </div>
                <div className="xem-truoc__bo">
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => boCanh(chiSo)}>
                    Bỏ cảnh này
                  </button>
                </div>
              </div>
            ))}

            <button className="btn btn--ghost btn--sm" type="button" onClick={themCanh} style={{ marginTop: 10 }}>
              <Icon name="i-plus" size={15} />
              Thêm cảnh
            </button>
          </div>

          <div className="bieu-mau__nut">
            <button className="btn btn--primary" type="button" onClick={luu} disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : 'Lưu kịch bản'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={sinh} disabled={dangSinh || dangLuu}>
              {dangSinh ? 'Đang soạn lại…' : 'Sinh lại'}
            </button>
            {moHinh ? <span className="ghi-chu-mo-hinh">Mô hình: {moHinh}</span> : null}
          </div>
        </>
      )}
    </>
  );
}

function SinhAnhChoBai({ contentId }: { contentId: string }) {
  const [duongDan, datDuongDan] = useState<string | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangSinh, batDauSinh] = useTransition();

  function sinh() {
    datLoi(null);
    batDauSinh(async () => {
      const kq = await sinhAnhAction(contentId);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datDuongDan(kq.duongDan);
    });
  }

  return (
    <div className="o" style={{ marginTop: 12 }}>
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      {duongDan ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/media/${duongDan}`}
          alt="Ảnh minh hoạ cho bài đăng"
          style={{ maxWidth: 320, borderRadius: 10, border: '1px solid var(--line)' }}
        />
      ) : (
        <button className="btn btn--ghost" type="button" onClick={sinh} disabled={dangSinh}>
          <Icon name="i-file" size={16} />
          {dangSinh ? 'Đang vẽ ảnh…' : 'Sinh ảnh cho bài này'}
        </button>
      )}
    </div>
  );
}
