import React from 'react';
import Link from 'next/link';
import Container from './Container';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-white py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <img
              src="/logos/podnbeyond-group.svg"
              alt="POD N BEYOND GROUP"
              className="h-12 mb-4 brightness-0 invert"
            />
            <p className="text-neutral-400 text-sm leading-relaxed">
              India's first multi-brand pod hotel group. Experience the future of hospitality.
            </p>
          </div>

          {/* Our Brands */}
          <div>
            <h3 className="font-bold text-lg mb-4">Our Brands</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/brands/capsule" className="text-neutral-400 hover:text-white transition-colors">
                  POD N BEYOND | Capsule
                </Link>
              </li>
              <li>
                <Link href="/brands/smart" className="text-neutral-400 hover:text-white transition-colors">
                  POD N BEYOND | Smart
                </Link>
              </li>
              <li>
                <Link href="/brands/sanctuary" className="text-neutral-400 hover:text-white transition-colors">
                  POD N BEYOND | Sanctuary
                </Link>
              </li>
              <li>
                <Link href="/brands/sauna-sleep" className="text-neutral-400 hover:text-white transition-colors">
                  POD N BEYOND | Sauna+Sleep
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/locations" className="text-neutral-400 hover:text-white transition-colors">
                  Locations
                </Link>
              </li>
              <li>
                <Link href="/concept" className="text-neutral-400 hover:text-white transition-colors">
                  Our Concept
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-neutral-400 hover:text-white transition-colors">
                  Membership
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <a href="tel:+919031000931" className="hover:text-white transition-colors">
                  +91-90310 00931
                </a>
              </li>
              <li>
                <a href="mailto:info@podnbeyond.com" className="hover:text-white transition-colors">
                  info@podnbeyond.com
                </a>
              </li>
              <li className="pt-4">
                <p className="text-sm">Jamshedpur, Jharkhand</p>
                <p className="text-sm">India</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-neutral-400 text-sm">
            © {currentYear} POD N BEYOND GROUP. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-neutral-400 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-neutral-400 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

