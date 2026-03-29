import React, { useState, useEffect, useCallback } from 'react'
import { Animator, Animated, Text, FrameCorners } from '@arwes/react'
import './ScreenshotCarousel.css'
import { screenshots } from './screenshotData'

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

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
    if (!isAutoPlaying || expandedIndex !== null) return

    const interval = setInterval(nextSlide, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, expandedIndex])

  useEffect(() => {
    if (expandedIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedIndex(null)
        setIsAutoPlaying(true)
        return
      }

      if (event.key === 'ArrowLeft') {
        setExpandedIndex((prev) =>
          prev === null ? currentIndex : (prev - 1 + screenshots.length) % screenshots.length
        )
        return
      }

      if (event.key === 'ArrowRight') {
        setExpandedIndex((prev) =>
          prev === null ? currentIndex : (prev + 1) % screenshots.length
        )
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedIndex, currentIndex])

  return (
    <Animator active>
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
                  <button
                    type="button"
                    className="carousel-image-button"
                    onClick={() => {
                      setExpandedIndex(index)
                      setCurrentIndex(index)
                      setIsAutoPlaying(false)
                    }}
                    aria-label={`Expand screenshot: ${screenshot.title}`}
                  >
                    <img
                      src={screenshot.src}
                      alt={screenshot.alt}
                      className="carousel-image"
                      loading="eager"
                    />
                  </button>
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

        {expandedIndex !== null && (
          <div
            className="carousel-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Expanded screenshot: ${screenshots[expandedIndex].title}`}
            onClick={() => {
              setExpandedIndex(null)
              setCurrentIndex(expandedIndex)
              setIsAutoPlaying(true)
            }}
          >
            <button
              type="button"
              className="carousel-lightbox-close"
              onClick={() => {
                setExpandedIndex(null)
                setCurrentIndex(expandedIndex)
                setIsAutoPlaying(true)
              }}
              aria-label="Close expanded screenshot"
            >
              ×
            </button>

            <button
              type="button"
              className="carousel-lightbox-nav carousel-lightbox-prev"
              onClick={(event) => {
                event.stopPropagation()
                setExpandedIndex((prev) =>
                  prev === null ? currentIndex : (prev - 1 + screenshots.length) % screenshots.length
                )
              }}
              aria-label="Previous expanded screenshot"
            >
              ‹
            </button>

            <img
              src={screenshots[expandedIndex].src}
              alt={screenshots[expandedIndex].alt}
              className="carousel-lightbox-image"
              onClick={(event) => event.stopPropagation()}
            />

            <button
              type="button"
              className="carousel-lightbox-nav carousel-lightbox-next"
              onClick={(event) => {
                event.stopPropagation()
                setExpandedIndex((prev) =>
                  prev === null ? currentIndex : (prev + 1) % screenshots.length
                )
              }}
              aria-label="Next expanded screenshot"
            >
              ›
            </button>
          </div>
        )}
      </Animated>
    </Animator>
  )
}
