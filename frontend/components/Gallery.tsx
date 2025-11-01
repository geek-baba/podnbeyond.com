import { useEffect, useState } from 'react';

interface GalleryImage {
  id: number;
  filename: string;
  url: string;
  altText: string;
  title: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gallery/images`);
        const data = await response.json();
        
        if (data.success) {
          setImages(data.images);
        } else {
          setError('Failed to load gallery');
        }
      } catch (err) {
        setError('Error loading gallery');
        console.error('Gallery error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8">Explore POD N BEYOND</h2>
      <p className="text-center text-gray-600 mb-12">
        Take a virtual tour of our modern capsule hotel in Jamshedpur
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${image.url}`}
              alt={image.altText}
              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white font-semibold">{image.title}</p>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-center text-gray-500">No images available</p>
      )}
    </div>
  );
}

