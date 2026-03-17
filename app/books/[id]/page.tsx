import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookDetail } from '@/components/book/book-detail'

interface BookPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
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
