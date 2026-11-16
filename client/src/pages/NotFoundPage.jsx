import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
        <Compass size={26} strokeWidth={1.7} />
      </span>
      <p className="eyebrow mt-5">Off the path</p>
      <h1 className="mt-1.5 text-[30px] leading-tight text-forest-800">This page is not part of your rhythm.</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        The link may be old or mistyped. Return to your dashboard — your streak and records are safe.
      </p>
      <Link to="/" className="mt-6">
        <Button>
          <ArrowLeft size={14} /> Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
