import { notFound } from 'next/navigation';
import archive from '@/data/archive';
import ProjectDetail from '@/components/ProjectDetail';
import Footer from '@/components/Footer';

// With `output: "export"` a dynamic route must produce at least one path; an
// empty array makes Next treat generateStaticParams as missing and fails the
// build. This placeholder is emitted only while the archive is empty (every
// collection deleted in the panel) and disappears once one is added back.
const EMPTY_PLACEHOLDER = 'proje-yok';

export function generateStaticParams() {
  if (archive.length === 0) return [{ id: EMPTY_PLACEHOLDER }];
  return archive.map((p) => ({ id: p.slug }));
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = archive.find((p) => p.slug === id);

  if (!project) notFound();

  return (
    <main>
      <ProjectDetail project={project} />
      <Footer />
    </main>
  );
}
