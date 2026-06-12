import { auth } from '@/lib/auth/config'
import { resolveSearchQuery, searchVerifiedPanditsCached } from '@/lib/db/search'
import { SearchSection } from '@/components/customer/SearchSection'

export const metadata = {
  title: 'Find a Pandit — PanditConnect',
  description:
    'Search verified Pandits for poojas, sanskars and religious ceremonies in Gujarat and across India. Transparent pricing, real reviews.',
}

interface Props {
  searchParams: Promise<{
    q?: string
    pooja?: string
    area?: string
    lang?: string
    minRating?: string
    maxPrice?: string
  }>
}

// Public search — no auth required. Logged-out visitors can browse Pandits and
// view profiles; booking is gated at the "Book Now" CTA.
export default async function PublicSearchPage({ searchParams }: Props) {
  const params = await searchParams
  const session = await auth()

  // Supports both ?q=<text> and legacy ?pooja=<catalog-key> URLs.
  const query = resolveSearchQuery(params)
  const results = query ? await searchVerifiedPanditsCached({ ...params, q: query }) : []

  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <div className="mx-auto max-w-6xl">
        <SearchSection query={query} results={results} basePath="/search" isLoggedIn={!!session?.user} />
      </div>
    </div>
  )
}
