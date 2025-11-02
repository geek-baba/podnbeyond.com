import React from 'react';
import Button from '../ui/Button';
import Container from '../layout/Container';

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  height?: 'screen' | 'large' | 'medium';
  overlay?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  description,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  height = 'screen',
  overlay = true,
}) => {
  const heightStyles = {
    screen: 'min-h-screen',
    large: 'min-h-[80vh]',
    medium: 'min-h-[60vh]',
  };

  return (
    <section
      className={`relative ${heightStyles[height]} flex items-center justify-center overflow-hidden`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 to-neutral-950/40" />
      )}

      {/* Content */}
      <Container className="relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm uppercase tracking-wider text-white/90 mb-4 font-semibold">
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h1 className="text-hero text-white mb-6 leading-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}

          {/* CTAs */}
          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {primaryCTA && (
                <a href={primaryCTA.href}>
                  <Button variant="primary" size="xl">
                    {primaryCTA.text}
                  </Button>
                </a>
              )}
              {secondaryCTA && (
                <a href={secondaryCTA.href}>
                  <Button variant="secondary" size="xl">
                    {secondaryCTA.text}
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;

