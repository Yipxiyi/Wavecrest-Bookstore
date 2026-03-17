import { createStaticClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookDetail } from '@/components/book/book-detail'

interface BookPageProps {
  params: Promise<{
    id: string
  }>
}

// Generate static params for all books
export async function generateStaticParams() {
  // Return a few sample IDs for static generation
  // In production, you might want to fetch these from Supabase at build time
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  const supabase = createStaticClient()
  
  const { data: book, error } = await supabase
    .from('books')
    .select(`
      *,
      ratings(*),
      tags(*),
      purchase_links(*)
    `)
    .eq('id', id)
    .single()

  if (error || !book) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BookDetail book={book} />
    </div>
  )
}
