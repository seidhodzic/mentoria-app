import Image from 'next/image';

type Props = {
  className?: string;
  priority?: boolean;
};

/**
 * Full brand lockup from `/public/mentoria-logo.svg` (crown + wordmark).
 */
export default function MentoriaLogo({
  className = 'h-6 w-auto max-h-6',
  priority,
}: Props) {
  return (
    <Image
      src="/mentoria-logo.svg"
      alt="Mentoria"
      width={960}
      height={142}
      priority={priority}
      className={className}
      unoptimized
    />
  );
}
