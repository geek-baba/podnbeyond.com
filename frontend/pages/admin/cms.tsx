import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';

interface Content {
  id: number;
  type: string;
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Image {
  id: number;
  type: string;
  url: string;
  altText?: string;
  title?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface Testimonial {
  id: number;
  guestName: string;
  guestEmail?: string;
  rating: number;
  title?: string;
  content: string;
  avatarImage?: Image;
  isActive: boolean;
  sortOrder: number;
}

interface Amenity {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
  iconImage?: Image;
  isActive: boolean;
  sortOrder: number;
}

const CMSAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'images' | 'testimonials' | 'amenities'>('content');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Content Management
  const [contents, setContents] = useState<Content[]>([]);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [contentForm, setContentForm] = useState({
    type: '',
    title: '',
    subtitle: '',
    description: '',
    content: '',
    isActive: true,
    sortOrder: 0
  });

  // Image Management
  const [images, setImages] = useState<Image[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageForm, setImageForm] = useState({
    type: '',
    altText: '',
    title: '',
    description: ''
  });

  // Testimonial Management
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    guestName: '',
    guestEmail: '',
    rating: 5,
    title: '',
    content: '',
    isActive: true,
    sortOrder: 0
  });

  // Amenity Management
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [amenityForm, setAmenityForm] = useState({
    name: '',
    description: '',
    iconName: '',
    isActive: true,
    sortOrder: 0
  });

  const contentTypes = [
    'HERO_SECTION',
    'ABOUT_SECTION',
    'ROOMS_SECTION',
    'AMENITIES_SECTION',
    'TESTIMONIALS_SECTION',
    'CONTACT_SECTION',
    'FOOTER_SECTION'
  ];

  const imageTypes = [
    'HERO_BACKGROUND',
    'ROOM_IMAGE',
    'AMENITY_ICON',
    'TESTIMONIAL_AVATAR',
    'GALLERY_IMAGE',
    'LOGO',
    'FAVICON'
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'content':
          const contentResponse = await axios.get('/api/cms/content');
          setContents(contentResponse.data.content || []);
          break;
        case 'images':
          const imagesResponse = await axios.get('/api/cms/images');
          setImages(imagesResponse.data.images || []);
          break;
        case 'testimonials':
          const testimonialsResponse = await axios.get('/api/cms/testimonials');
          setTestimonials(testimonialsResponse.data.testimonials || []);
          break;
        case 'amenities':
          const amenitiesResponse = await axios.get('/api/cms/amenities');
          setAmenities(amenitiesResponse.data.amenities || []);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  // Content Management Functions
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/cms/content', contentForm);
      setMessage({ type: 'success', text: 'Content saved successfully' });
      setContentForm({
        type: '',
        title: '',
        subtitle: '',
        description: '',
        content: '',
        isActive: true,
        sortOrder: 0
      });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save content' });
    } finally {
      setLoading(false);
    }
  };

  // Image Management Functions
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('type', imageForm.type);
    formData.append('altText', imageForm.altText);
    formData.append('title', imageForm.title);
    formData.append('description', imageForm.description);

    try {
      await axios.post('/api/cms/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Image uploaded successfully' });
      setSelectedFile(null);
      setImageForm({
        type: '',
        altText: '',
        title: '',
        description: ''
      });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await axios.delete(`/api/cms/images/${id}`);
      setMessage({ type: 'success', text: 'Image deleted successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete image' });
    }
  };

  // Testimonial Management Functions
  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTestimonial) {
        await axios.put(`/api/cms/testimonials/${editingTestimonial.id}`, testimonialForm);
      } else {
        await axios.post('/api/cms/testimonials', testimonialForm);
      }
      setMessage({ type: 'success', text: 'Testimonial saved successfully' });
      setEditingTestimonial(null);
      setTestimonialForm({
        guestName: '',
        guestEmail: '',
        rating: 5,
        title: '',
        content: '',
        isActive: true,
        sortOrder: 0
      });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save testimonial' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestimonialDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    
    try {
      await axios.delete(`/api/cms/testimonials/${id}`);
      setMessage({ type: 'success', text: 'Testimonial deleted successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete testimonial' });
    }
  };

  // Amenity Management Functions
  const handleAmenitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAmenity) {
        await axios.put(`/api/cms/amenities/${editingAmenity.id}`, amenityForm);
      } else {
        await axios.post('/api/cms/amenities', amenityForm);
      }
      setMessage({ type: 'success', text: 'Amenity saved successfully' });
      setEditingAmenity(null);
      setAmenityForm({
        name: '',
        description: '',
        iconName: '',
        isActive: true,
        sortOrder: 0
      });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save amenity' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this amenity?')) return;
    
    try {
      await axios.delete(`/api/cms/amenities/${id}`);
      setMessage({ type: 'success', text: 'Amenity deleted successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete amenity' });
    }
  };

  const tabs = [
    { id: 'content', name: 'Content', icon: '📝' },
    { id: 'images', name: 'Images', icon: '🖼️' },
    { id: 'testimonials', name: 'Testimonials', icon: '💬' },
    { id: 'amenities', name: 'Amenities', icon: '🏨' }
  ];

  return (
    <>
      <Head>
        <title>CMS Admin - Pod & Beyond Hotel</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">CMS Management</h1>
                <p className="mt-2 text-gray-600">Manage your hotel website content</p>
              </div>
              <a
                href="/admin"
                className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Admin
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Content Management Tab */}
                {activeTab === 'content' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Content Management</h2>
                    </div>
                    
                    {/* Content Form */}
                    <form onSubmit={handleContentSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingContent ? 'Edit Content' : 'Add New Content'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content Type
                          </label>
                          <select
                            value={contentForm.type}
                            onChange={(e) => setContentForm({...contentForm, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select content type</option>
                            {contentTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={contentForm.title}
                            onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={contentForm.subtitle}
                            onChange={(e) => setContentForm({...contentForm, subtitle: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            value={contentForm.sortOrder}
                            onChange={(e) => setContentForm({...contentForm, sortOrder: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={contentForm.description}
                          onChange={(e) => setContentForm({...contentForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="mt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contentForm.isActive}
                            onChange={(e) => setContentForm({...contentForm, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                      <div className="mt-6">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          {editingContent ? 'Update Content' : 'Add Content'}
                        </button>
                      </div>
                    </form>

                    {/* Content List */}
                    <div className="space-y-4">
                      {contents.map((content) => (
                        <div key={content.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{content.type}</h4>
                              {content.title && <p className="text-gray-600">{content.title}</p>}
                              {content.description && <p className="text-gray-500 text-sm mt-1">{content.description}</p>}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                content.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {content.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images Management Tab */}
                {activeTab === 'images' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Image Management</h2>
                    </div>
                    
                    {/* Image Upload Form */}
                    <form onSubmit={handleImageUpload} className="mb-8 bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Image</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image Type
                          </label>
                          <select
                            value={imageForm.type}
                            onChange={(e) => setImageForm({...imageForm, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select image type</option>
                            {imageTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image File
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alt Text
                          </label>
                          <input
                            type="text"
                            value={imageForm.altText}
                            onChange={(e) => setImageForm({...imageForm, altText: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={imageForm.title}
                            onChange={(e) => setImageForm({...imageForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={imageForm.description}
                          onChange={(e) => setImageForm({...imageForm, description: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="mt-6">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Upload Image
                        </button>
                      </div>
                    </form>

                    {/* Images Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {images.map((image) => (
                        <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                          <img
                            src={image.url}
                            alt={image.altText || image.title}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{image.type}</h4>
                              {image.title && <p className="text-gray-600 text-sm">{image.title}</p>}
                            </div>
                            <button
                              onClick={() => handleImageDelete(image.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testimonials Management Tab */}
                {activeTab === 'testimonials' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Testimonials Management</h2>
                    </div>
                    
                    {/* Testimonial Form */}
                    <form onSubmit={handleTestimonialSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Name
                          </label>
                          <input
                            type="text"
                            value={testimonialForm.guestName}
                            onChange={(e) => setTestimonialForm({...testimonialForm, guestName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Email
                          </label>
                          <input
                            type="email"
                            value={testimonialForm.guestEmail}
                            onChange={(e) => setTestimonialForm({...testimonialForm, guestEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                          </label>
                          <select
                            value={testimonialForm.rating}
                            onChange={(e) => setTestimonialForm({...testimonialForm, rating: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            {[1, 2, 3, 4, 5].map(rating => (
                              <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            value={testimonialForm.sortOrder}
                            onChange={(e) => setTestimonialForm({...testimonialForm, sortOrder: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={testimonialForm.title}
                          onChange={(e) => setTestimonialForm({...testimonialForm, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content
                        </label>
                        <textarea
                          value={testimonialForm.content}
                          onChange={(e) => setTestimonialForm({...testimonialForm, content: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="mt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={testimonialForm.isActive}
                            onChange={(e) => setTestimonialForm({...testimonialForm, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                      <div className="mt-6">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
                        </button>
                      </div>
                    </form>

                    {/* Testimonials List */}
                    <div className="space-y-4">
                      {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{testimonial.guestName}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span key={i} className={`text-sm ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              {testimonial.title && <p className="text-gray-600 text-sm mt-1">{testimonial.title}</p>}
                              <p className="text-gray-500 text-sm mt-2">"{testimonial.content}"</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                testimonial.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {testimonial.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => handleTestimonialDelete(testimonial.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities Management Tab */}
                {activeTab === 'amenities' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Amenities Management</h2>
                    </div>
                    
                    {/* Amenity Form */}
                    <form onSubmit={handleAmenitySubmit} className="mb-8 bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={amenityForm.name}
                            onChange={(e) => setAmenityForm({...amenityForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icon Name
                          </label>
                          <input
                            type="text"
                            value={amenityForm.iconName}
                            onChange={(e) => setAmenityForm({...amenityForm, iconName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., wifi, pool, gym"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            value={amenityForm.sortOrder}
                            onChange={(e) => setAmenityForm({...amenityForm, sortOrder: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={amenityForm.description}
                          onChange={(e) => setAmenityForm({...amenityForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="mt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={amenityForm.isActive}
                            onChange={(e) => setAmenityForm({...amenityForm, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                      <div className="mt-6">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          {editingAmenity ? 'Update Amenity' : 'Add Amenity'}
                        </button>
                      </div>
                    </form>

                    {/* Amenities List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {amenities.map((amenity) => (
                        <div key={amenity.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{amenity.name}</h4>
                              {amenity.description && <p className="text-gray-600 text-sm mt-1">{amenity.description}</p>}
                              {amenity.iconName && <p className="text-gray-500 text-xs mt-1">Icon: {amenity.iconName}</p>}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                amenity.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {amenity.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => handleAmenityDelete(amenity.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CMSAdminPage; 