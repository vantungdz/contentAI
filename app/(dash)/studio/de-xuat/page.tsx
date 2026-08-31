import type { Metadata } from 'next';

import { Icon } from '../../../sprite-icon';
import { ManHinhDeXuat } from './man-hinh-de-xuat';
import { kiemTraDeXuat } from '@/lib/brand/do-day-du';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import '../../brand/brand.css';
import '../studio.css';
// Dung lai lop the/luoi cua man "Mau noi dung" thay vi chep CSS sang day.
import '../../templates/content-templates-page.css';
import './de-xuat.css';

export const metadata: Metadata = {
  title: 'Đề xuất hôm nay — AI Content',
};

export default async function TrangDeXuat() {
  const repo = createRepo(await workspaceHienTai());
  const [truCot, chanDung, sanPham, insight, hoSo] = await Promise.all([
    repo.truCot.list(),
    repo.chanDung.list(),
    repo.sanPham.list(),
    repo.insight.list(),
    repo.hoSo.lay(),
  ]);
  const kiem = kiemTraDeXuat({ truCot, chanDung, sanPham, insight, hoSo });

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-sparkle" size={13} />
            Studio nội dung
          </span>
          <h1 className="page-title">Đề xuất hôm nay</h1>
          <p className="page-sub">
            Máy đọc hồ sơ thương hiệu, trụ cột, chân dung khách hàng và insight để đề xuất ý
            tưởng — mỗi ý tưởng nêu rõ vì sao được chọn. Chọn ý ưng rồi lưu vào danh sách ý
            tưởng của kênh.
          </p>
        </div>
      </div>

      <section className="panel" aria-label="Đề xuất ý tưởng">
        <ManHinhDeXuat
          kiemTraBanDau={{
            duocPhep: kiem.duocPhep,
            phanTram: kiem.phanTram,
            lyDo: kiem.lyDo,
          }}
        />
      </section>
    </>
  );
}
