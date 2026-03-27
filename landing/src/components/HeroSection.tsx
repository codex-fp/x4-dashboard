import type { FC } from 'react'
import { Animator, Animated, Text } from '@arwes/react'
import { ScreenshotCarousel } from './ScreenshotCarousel'
import './HeroSection.css'

interface HeroSectionProps {
  onGuideClick: () => void
}

export const HeroSection: FC<HeroSectionProps> = ({ onGuideClick }) => {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-content">
        <Animator active>
          <Animated
            as="div"
            className="hero-badge"
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
              ◈ BROWSER-FIRST COCKPIT HUD
            </Text>
          </Animated>
        </Animator>

        <Animator active>
          <Animated
            as="h1"
            className="hero-title"
            animated={['fade', ['y', 30, 0]]}
            style={{ animationDelay: '0.1s' }}
          >
            <Text
              as="span"
              manager="sequence"
              fixed
              contentStyle={{
                fontSize: 'clamp(36px, 8vw, 72px)',
                fontWeight: 700,
                letterSpacing: '2px',
                lineHeight: 1.1,
                color: 'hsl(200deg 20% 95%)',
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              X4 DASHBOARD
            </Text>
          </Animated>
        </Animator>

        <Animator active>
          <Animated
            as="div"
            className="hero-subtitle"
            animated={['fade', ['y', 20, 0]]}
            style={{ animationDelay: '0.2s' }}
          >
            <Text
              manager="sequence"
              fixed
              contentStyle={{
                fontSize: 'clamp(16px, 2.5vw, 22px)',
                fontWeight: 300,
                letterSpacing: '1px',
                lineHeight: 1.6,
                color: 'hsl(200deg 20% 70%)',
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              Live telemetry, multi-device layouts, and sci-fi HUD for X4: Foundations
            </Text>
          </Animated>
        </Animator>

        <Animator active>
          <Animated
            as="div"
            className="hero-cta"
            animated={['fade', ['y', 20, 0]]}
            style={{ animationDelay: '0.3s' }}
          >
            <a
              href="https://github.com/fpiechowski/x4-dashboard/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button primary"
            >
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '14px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Download
              </Text>
            </a>
            <a
              href="https://x4-dashboard.piechowski.pro/mock"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button secondary"
            >
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '14px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Live Demo
              </Text>
            </a>
            <button
              onClick={onGuideClick}
              className="cta-button secondary"
            >
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '14px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Player Guide
              </Text>
            </button>
          </Animated>
        </Animator>

        <Animator active>
          <Animated
            as="div"
            className="hero-stats"
            animated={['fade']}
            style={{ animationDelay: '0.5s' }}
          >
            <div className="stat-item">
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'hsl(191deg 100% 50%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Live
              </Text>
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'hsl(200deg 20% 60%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Telemetry
              </Text>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'hsl(191deg 100% 50%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Multi
              </Text>
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'hsl(200deg 20% 60%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Device
              </Text>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'hsl(191deg 100% 50%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Arwes
              </Text>
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'hsl(200deg 20% 60%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Sci-Fi UI
              </Text>
            </div>
          </Animated>
        </Animator>
      </div>

      <div className="hero-visual">
        <ScreenshotCarousel />
      </div>
    </section>
  )
}
