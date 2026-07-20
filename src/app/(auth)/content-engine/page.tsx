import { ContentCommandCenter } from '@/modules/content-engine/components/ContentCommandCenter';
import { ContentLibrary } from '@/modules/content-library/components/ContentLibrary';

export default function ContentEnginePage() {
  return (
    <div className="py-6">
      <ContentCommandCenter />
      <ContentLibrary />
    </div>
  );
}
