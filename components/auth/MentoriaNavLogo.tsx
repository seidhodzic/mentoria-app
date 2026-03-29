import MentoriaLogo from '@/components/MentoriaLogo';
import { marketingHref } from '@/lib/marketing-url';

type Props = {
  /** Passed to the image (default: boutique h-6 lockup). */
  logoClassName?: string;
};

/**
 * Marketing-site link + full brand lockup.
 */
export default function MentoriaNavLogo({ logoClassName }: Props) {
  return (
    <a
      href={marketingHref('index.html')}
      className="inline-flex items-center no-underline"
    >
      <MentoriaLogo priority className={logoClassName} />
    </a>
  );
}
