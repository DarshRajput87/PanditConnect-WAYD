import { searchPandits } from '@/actions/customer-dashboard'
import { SearchSection } from '@/components/customer/SearchSection'

interface Props {
  searchParams: Promise<{ q?: string; area?: string; lang?: string; minRating?: string; maxPrice?: string }>
}

export default async function CustomerSearchPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const results = query ? await searchPandits(params) : []

  return <SearchSection query={query} results={results} />
}
