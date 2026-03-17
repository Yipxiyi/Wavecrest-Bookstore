import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">🌊 Wavecrest Bookstore</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover your next great read. A curated collection of books with 
            ratings, reviews, and purchase links from multiple platforms.
          </p>
          <Link
            href="/books"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Browse Books
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Curated Collection</h3>
              <p className="text-gray-600">
                Carefully selected books from various genres and publishers.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Ratings & Reviews</h3>
              <p className="text-gray-600">
                Community-driven ratings powered by NeoDB integration.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2">Price Comparison</h3>
              <p className="text-gray-600">
                Compare prices across multiple platforms in one place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
