import React, { useState, useEffect, useCallback } from 'react'
import { Animator, Animated, Text, FrameCorners } from '@arwes/react'
import './ScreenshotCarousel.css'

interface Screenshot {
  src: string
  alt: string
  title: string
}

const screenshots: Screenshot[] = [
  {
    src: 'https://raw.githubusercontent.com/fpiechowski/x4-dashboard/master/docs/screenshots/dashboard-flight.png',
    alt: 'Flight dashboard showing ship telemetry',
    title: 'Flight Dashboard',
  },
  {
    src: 'https://raw.githubusercontent.com/fpiechowski/x4-dashboard/master/docs/screenshots/dashboard-flight-arc.png',
    alt: 'Flight dashboard with ARC speedometer',
    title: 'ARC Speedometer',
  },
  {
    src: 'https://raw.githubusercontent.com/fpiechowski/x4-dashboard/master/docs/screenshots/dashboard-operations.png',
    alt: 'Operations dashboard',
    title: 'Operations View',
  },
]

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 5000)
  }

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(nextSlide, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  return (
    <Animator>
      <Animated
        as="div"
        className="carousel-container"
        animated={['fade']}
        style={{ opacity: 1 }}
      >
        <FrameCorners
          style={{
            '--arwes-frames-line-color': 'hsl(191deg 100% 50%)',
            '--arwes-frames-bg-color': 'hsl(191deg 100% 50% / 5%)',
            '--arwes-frames-line-filter': 'drop-shadow(0 0 8px hsl(191deg 100% 50% / 40%))',
          } as React.CSSProperties}
          animated
          strokeWidth={2}
          cornerLength={24}
        />
        <div className="carousel-content">
          <div className="carousel-slides">
            {screenshots.map((screenshot, index) => (
              <div
                key={screenshot.title}
                className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
                style={{
                  transform: `translateX(${(index - currentIndex) * 100}%)`,
                }}
              >
                <div className="carousel-image-wrapper">
                  <img
                    src={screenshot.src}
                    alt={screenshot.alt}
                    className="carousel-image"
                    loading="eager"
                  />
                  <div className="carousel-overlay" />
                </div>
              </div>
            ))}
          </div>

          <div className="carousel-info">
            <Text
              as="h3"
              manager="sequence"
              fixed
              contentStyle={{
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'hsl(200deg 20% 95%)',
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              {screenshots[currentIndex].title}
            </Text>
          </div>

          <button
            className="carousel-nav carousel-prev"
            onClick={() => {
              prevSlide()
              setIsAutoPlaying(false)
              setTimeout(() => setIsAutoPlaying(true), 5000)
            }}
            aria-label="Previous screenshot"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            className="carousel-nav carousel-next"
            onClick={() => {
              nextSlide()
              setIsAutoPlaying(false)
              setTimeout(() => setIsAutoPlaying(true), 5000)
            }}
            aria-label="Next screenshot"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="carousel-dots">
            {screenshots.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Animated>
    </Animator>
  )
}
