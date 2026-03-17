import { createStaticClient } from '@/lib/supabase/server'
import { BookList } from '@/components/book/book-list'

export default async function BooksPage() {
  const supabase = createStaticClient()
  const { data: books, error } = await supabase
    .from('books')
    .select(`
      *,
      ratings(*),
      tags(*),
      purchase_links(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching books:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Books</h1>
        <p className="text-red-500">Error loading books. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Books</h1>
      <BookList books={books || []} />
    </div>
  )
}
