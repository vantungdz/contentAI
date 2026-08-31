'use client';

import { useMemo, useState } from 'react';

import { Icon } from '../../../sprite-icon';
import { sinhAnhHangLoat, sinhHangLoatMotBai } from './actions';
import type { BeMat } from '@/lib/studio/kieu';

type YTuongHangLoat = {
  id: string;
  tieuDe: string;
  beMat: BeMat;
  truCot: string | null;
  chanDung: string | null;
};

const NHAN_BE_MAT: Record<BeMat, string> = {
  fanpage: 'Fanpage',
  ho_so_ca_nhan: 'Trang cá nhân',
  tiktok: 'TikTok',
  zalo: 'Zalo',
};

type TrangThaiMuc = 'cho' | 'dang-chay' | 'xong' | 'loi';

type KetQuaMuc = {
  trangThai: TrangThaiMuc;
  contentId: string | null;
  tieuDe: string | null;
  noiDung: string | null;
  loi: string | null;
};

export function ManHinhHangLoat({ danhSach }: { danhSach: YTuongHangLoat[] }) {
  const [locBeMat, datLocBeMat] = useState<BeMat | 'tat-ca'>('tat-ca');
  const [daChon, datDaChon] = useState<Set<string>>(new Set());
  const [ketQua, datKetQua] = useState<Map<string, KetQuaMuc>>(new Map());
  const [dangChay, datDangChay] = useState(false);
  const [mucMoRong, datMucMoRong] = useState<string | null>(null);
  const [anhTheoContent, datAnhTheoContent] = useState<Map<string, string>>(new Map());
  const [loiAnhTheoContent, datLoiAnhTheoContent] = useState<Map<string, string>>(new Map());
  const [dangSinhAnh, datDangSinhAnh] = useState<string | null>(null);

  const hienThi = useMemo(
    () => (locBeMat === 'tat-ca' ? danhSach : danhSach.filter((y) => y.beMat === locBeMat)),
    [danhSach, locBeMat],
  );

  function bat(id: string) {
    if (dangChay) return;
    const moi = new Set(daChon);
    if (moi.has(id)) moi.delete(id);
    else moi.add(id);
    datDaChon(moi);
  }

  function chonHienThi() {
    datDaChon(new Set(hienThi.map((y) => y.id)));
  }

  function boChon() {
    datDaChon(new Set());
  }

  async function chay() {
    const ids = [...daChon];
    if (ids.length === 0) return;

    datDangChay(true);
    const moi = new Map<string, KetQuaMuc>();
    for (const id of ids) {
      moi.set(id, { trangThai: 'cho', contentId: null, tieuDe: null, noiDung: null, loi: null });
    }
    datKetQua(new Map(moi));

    // Tuan tu tung y tuong mot - de hien tien do tang dan, khong doi ca lo xong
    // moi thay ket qua dau tien.
    for (const id of ids) {
      moi.set(id, { trangThai: 'dang-chay', contentId: null, tieuDe: null, noiDung: null, loi: null });
      datKetQua(new Map(moi));

      const kq = await sinhHangLoatMotBai(id);
      moi.set(id, {
        trangThai: kq.ok ? 'xong' : 'loi',
        contentId: kq.contentId,
        tieuDe: kq.tieuDe,
        noiDung: kq.noiDung,
        loi: kq.loi,
      });
      datKetQua(new Map(moi));
    }

    datDangChay(false);
  }

  async function sinhAnh(contentId: string) {
    datDangSinhAnh(contentId);
    const kq = await sinhAnhHangLoat(contentId);
    if (kq.ok) {
      datAnhTheoContent((truoc) => new Map(truoc).set(contentId, kq.duongDan));
    } else {
      datLoiAnhTheoContent((truoc) => new Map(truoc).set(contentId, kq.loi));
    }
    datDangSinhAnh(null);
  }

  const tongDaXong = [...ketQua.values()].filter((k) => k.trangThai === 'xong' || k.trangThai === 'loi').length;
  const soThanhCong = [...ketQua.values()].filter((k) => k.trangThai === 'xong').length;
  const dangChayHayXong = ketQua.size > 0;

  return (
    <div className="soan">
      <div className="chon-be-mat" role="tablist" aria-label="Lọc theo bề mặt">
        {(['tat-ca', 'fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo'] as const).map((b) => (
          <button
            key={b}
            type="button"
            className={`btn btn--sm ${locBeMat === b ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => datLocBeMat(b)}
            disabled={dangChay}
          >
            {b === 'tat-ca' ? 'Tất cả' : NHAN_BE_MAT[b]}
          </button>
        ))}
      </div>

      <div className="bieu-mau__nut">
        <button className="btn btn--ghost btn--sm" type="button" onClick={chonHienThi} disabled={dangChay}>
          Chọn {hienThi.length} ý tưởng đang lọc
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={boChon} disabled={dangChay}>
          Bỏ chọn hết
        </button>
        <span className="count">
          {daChon.size} đã chọn{daChon.size >= 10 ? ' — đủ mục tiêu 10 bài/ngày' : ''}
        </span>
      </div>

      {dangChayHayXong ? (
        <div className="tien-do">
          <div className="tien-do__thanh">
            <span
              className="tien-do__chay"
              style={{ width: `${ketQua.size ? Math.round((tongDaXong / ketQua.size) * 100) : 0}%` }}
            />
          </div>
          <span className="soan__lech">
            {tongDaXong}/{ketQua.size} xong — {soThanhCong} bài thành công
          </span>
        </div>
      ) : null}

      <div className="xem-truoc__khoi">
        <h2 className="xem-truoc__tieu-de">
          Ý tưởng chưa dùng
          <span className="xem-truoc__dem">{hienThi.length} ý tưởng</span>
        </h2>

        {hienThi.map((y) => {
          const kq = ketQua.get(y.id);
          const moRong = mucMoRong === y.id;
          return (
            <div className="xem-truoc__mon" key={y.id}>
              <label className="muc--chon">
                <input
                  type="checkbox"
                  checked={daChon.has(y.id)}
                  onChange={() => bat(y.id)}
                  disabled={dangChay}
                />
                <span>
                  <span className="cot-be-mat__tieu-de">
                    {y.tieuDe} <span className="cot-be-mat__the">[{NHAN_BE_MAT[y.beMat]}]</span>
                  </span>
                  <span className="cot-be-mat__the">
                    {y.truCot ?? 'chưa neo trụ cột'} · {y.chanDung ?? 'chưa neo chân dung'}
                  </span>
                </span>
              </label>

              {kq ? (
                <p className={`soan__lech ${kq.trangThai === 'loi' ? 'soan__dem--dai' : ''}`}>
                  {kq.trangThai === 'cho' ? 'Đang chờ…' : null}
                  {kq.trangThai === 'dang-chay' ? 'Đang sinh…' : null}
                  {kq.trangThai === 'xong' ? (
                    <>
                      <Icon name="i-check" size={14} /> Đã lưu bản nháp: {kq.tieuDe}{' '}
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => datMucMoRong(moRong ? null : y.id)}
                      >
                        {moRong ? 'Ẩn nội dung' : 'Xem nội dung'}
                      </button>
                    </>
                  ) : null}
                  {kq.trangThai === 'loi' ? <>Lỗi: {kq.loi}</> : null}
                </p>
              ) : null}

              {moRong && kq?.noiDung ? <p className="preview">{kq.noiDung}</p> : null}

              {moRong && kq?.trangThai === 'xong' && kq.contentId ? (
                <div className="o" style={{ marginTop: 8 }}>
                  {anhTheoContent.has(kq.contentId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/${anhTheoContent.get(kq.contentId)}`}
                      alt="Ảnh minh hoạ cho bài đăng"
                      style={{ maxWidth: 240, borderRadius: 10, border: '1px solid var(--line)' }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => sinhAnh(kq.contentId as string)}
                      disabled={dangSinhAnh === kq.contentId}
                    >
                      {dangSinhAnh === kq.contentId ? 'Đang vẽ ảnh…' : 'Sinh ảnh cho bài này'}
                    </button>
                  )}
                  {loiAnhTheoContent.has(kq.contentId) ? (
                    <p className="loi" role="alert">
                      {loiAnhTheoContent.get(kq.contentId)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="bieu-mau__nut">
        <button className="btn btn--primary" type="button" onClick={chay} disabled={dangChay || daChon.size === 0}>
          <Icon name="i-sparkle" size={17} />
          {dangChay ? `Đang sinh (${tongDaXong}/${daChon.size})…` : `Sinh hàng loạt (${daChon.size})`}
        </button>
      </div>
    </div>
  );
}
