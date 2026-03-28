import React from 'react'
import { Animator, Animated, Text, FrameCorners } from '@arwes/react'
import './ScreenshotsSection.css'
import { screenshots } from './screenshotData'

export function ScreenshotsSection() {
  return (
    <section className="screenshots-section" id="screenshots">
      <div className="screenshots-container">
        <Animator>
          <Animated
            as="div"
            className="section-header"
            animated={['fade', ['y', 20, 0]]}
          >
            <Text
              as="span"
              manager="sequence"
              fixed
              contentStyle={{
                fontSize: '11px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'hsl(191deg 100% 50%)',
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 500,
              }}
            >
              ◈ SCREENSHOTS
            </Text>
            <Text
              as="h2"
              manager="sequence"
              fixed
              contentStyle={{
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'hsl(200deg 20% 95%)',
                fontFamily: "'Exo 2', sans-serif",
                marginTop: '16px',
              }}
            >
              See It In Action
            </Text>
          </Animated>
        </Animator>

        <div className="screenshots-grid">
          {screenshots.map((screenshot, index) => (
            <Animator key={screenshot.title}>
              <Animated
                as="div"
                className="screenshot-card"
                animated={['fade', ['y', 20, 0]]}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <FrameCorners
                  style={{
                    '--arwes-frames-line-color': 'hsl(191deg 100% 50%)',
                    '--arwes-frames-bg-color': 'hsl(191deg 100% 50% / 5%)',
                    '--arwes-frames-line-filter': 'drop-shadow(0 0 8px hsl(191deg 100% 50% / 30%))',
                  } as React.CSSProperties}
                  animated
                  strokeWidth={1}
                  cornerLength={16}
                />
                <div className="screenshot-content">
                  <div className="screenshot-image-wrapper">
                    <img
                      src={screenshot.src}
                      alt={screenshot.alt}
                      className="screenshot-image"
                      loading="lazy"
                    />
                    <div className="screenshot-overlay" />
                  </div>
                  <div className="screenshot-info">
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
                      {screenshot.title}
                    </Text>
                  </div>
                </div>
              </Animated>
            </Animator>
          ))}
        </div>
      </div>
    </section>
  )
}
