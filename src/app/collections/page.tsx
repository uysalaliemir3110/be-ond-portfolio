import CollectionsGridFull from '@/components/CollectionsGridFull';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Collections — BE/OND',
  description: 'Every BE/OND collection, season by season.',
};

export default function CollectionsPage() {
  return (
    <main>
      <CollectionsGridFull />
      <Footer />
    </main>
  );
}
