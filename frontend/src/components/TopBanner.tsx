import { useCallback } from 'react'
import { X } from 'lucide-react'
import { useAppState } from '../store'

export function TopBanner() {
  const { isBannerVisible, setBannerVisible } = useAppState();

  const handleCloseBanner = useCallback(() => {
    setBannerVisible(false);
  }, [setBannerVisible]);

  if (!isBannerVisible) {
    return null;
  }

  return (
    <div className="relative w-full max-w-3xl px-2 py-2 mx-auto mt-4 mb-2 font-medium text-white bg-orange-500 rounded-md text-sm">
      <button
        onClick={handleCloseBanner}
        className="absolute top-2 right-2 p-1 bg-orange-600 hover:bg-orange-700 rounded transition-colors"
        aria-label="Close banner"
      >
        <X className="w-4 h-4" />
      </button>
      <p className='px-4'>Chat is powered by the backend. Configure <code className="bg-orange-600/80 px-1 rounded">LLM_PROVIDER</code> and <code className="bg-orange-600/80 px-1 rounded">LLM_API_KEY</code> in the backend environment (see backend README).</p>
    </div>
  );
}
