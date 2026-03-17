import { Database } from '@/types/database'

type BookWithRelations = Database['public']['Tables']['books']['Row'] & {
  ratings: Database['public']['Tables']['ratings']['Row'] | null
  tags: Database['public']['Tables']['tags']['Row'][]
  purchase_links: Database['public']['Tables']['purchase_links']['Row'][]
}

interface BookDetailProps {
  book: BookWithRelations
}

export function BookDetail({ book }: BookDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cover Image */}
        <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <span className="text-6xl">📚</span>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          
          {book.authors && book.authors.length > 0 && (
            <p className="text-lg text-gray-600 mb-4">
              by {book.authors.join(', ')}
            </p>
          )}

          {book.ratings?.rating_average && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-yellow-500">★</span>
              <span className="text-xl font-semibold">
                {book.ratings.rating_average.toFixed(1)}
              </span>
              <span className="text-gray-500">
                / 10 ({book.ratings.rating_count} ratings)
              </span>
            </div>
          )}

          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {book.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            {book.publisher && (
              <p><span className="font-medium">Publisher:</span> {book.publisher}</p>
            )}
            {book.publication_year && (
              <p><span className="font-medium">Year:</span> {book.publication_year}</p>
            )}
            {book.language && (
              <p><span className="font-medium">Language:</span> {book.language}</p>
            )}
            {book.neodb_id && (
              <p><span className="font-medium">NeoDB ID:</span> {book.neodb_id}</p>
            )}
          </div>

          {book.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Purchase Links */}
          {book.purchase_links && book.purchase_links.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Where to Buy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {book.purchase_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{link.platform}</p>
                      <p className="text-sm text-gray-500">
                        {link.availability === 'available' ? 'In Stock' : 
                         link.availability === 'out_of_stock' ? 'Out of Stock' :
                         link.availability === 'pre_order' ? 'Pre-order' : 'Discontinued'}
                      </p>
                    </div>
                    {link.price && (
                      <p className="text-lg font-semibold">
                        {link.currency} {link.price.toFixed(2)}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
