import Link from 'next/link'
import { Database } from '@/types/database'

type BookWithRelations = Database['public']['Tables']['books']['Row'] & {
  ratings: Database['public']['Tables']['ratings']['Row'] | null
  tags: Database['public']['Tables']['tags']['Row'][]
  purchase_links: Database['public']['Tables']['purchase_links']['Row'][]
}

interface BookListProps {
  books: BookWithRelations[]
}

export function BookList({ books }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="aspect-[2/3] bg-gray-200 relative overflow-hidden">
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                <span className="text-4xl">📚</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h2 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {book.authors?.join(', ') || 'Unknown Author'}
            </p>
            {book.ratings?.rating_average && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium">
                  {book.ratings.rating_average.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">
                  ({book.ratings.rating_count} ratings)
                </span>
              </div>
            )}
            {book.tags && book.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {book.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                  >
                    {tag.tag}
                  </span>
                ))}
                {book.tags.length > 3 && (
                  <span className="text-xs px-2 py-1 text-gray-400">
                    +{book.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
