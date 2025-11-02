import React, { useState } from 'react';
import Link from 'next/link';
import Container from './Container';

interface HeaderProps {
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bgStyle = transparent
    ? 'bg-transparent absolute top-0 left-0 right-0 z-50'
    : 'bg-white shadow-minimal';

  const textStyle = transparent ? 'text-white' : 'text-neutral-900';
  const logoSrc = transparent ? '/logos/podnbeyond-group.svg' : '/logos/podnbeyond-group.svg';

  return (
    <header className={`${bgStyle} transition-all duration-300`}>
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img src={logoSrc} alt="POD N BEYOND" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/brands" className={`${textStyle} hover:opacity-70 transition-opacity font-medium`}>
              Our Brands
            </Link>
            <Link href="/locations" className={`${textStyle} hover:opacity-70 transition-opacity font-medium`}>
              Locations
            </Link>
            <Link href="/concept" className={`${textStyle} hover:opacity-70 transition-opacity font-medium`}>
              Concept
            </Link>
            <Link href="/membership" className={`${textStyle} hover:opacity-70 transition-opacity font-medium`}>
              Membership
            </Link>
            <Link
              href="/book"
              className={`px-6 py-2 rounded-button font-semibold transition-all ${
                transparent
                  ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              Book Now
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden ${textStyle}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-slide-down">
            <Link
              href="/brands"
              className={`block ${textStyle} hover:opacity-70 transition-opacity font-medium`}
            >
              Our Brands
            </Link>
            <Link
              href="/locations"
              className={`block ${textStyle} hover:opacity-70 transition-opacity font-medium`}
            >
              Locations
            </Link>
            <Link
              href="/concept"
              className={`block ${textStyle} hover:opacity-70 transition-opacity font-medium`}
            >
              Concept
            </Link>
            <Link
              href="/membership"
              className={`block ${textStyle} hover:opacity-70 transition-opacity font-medium`}
            >
              Membership
            </Link>
            <Link
              href="/book"
              className={`block px-6 py-2 rounded-button font-semibold text-center ${
                transparent
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-900 text-white'
              }`}
            >
              Book Now
            </Link>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;

