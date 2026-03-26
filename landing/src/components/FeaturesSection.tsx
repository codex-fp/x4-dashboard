import React from 'react'
import { Animator, Animated, Text, FrameCorners } from '@arwes/react'
import './FeaturesSection.css'

interface Feature {
  icon: string
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: '◈',
    title: 'Live Telemetry',
    description: 'Real-time ship status, combat data, mission progress, and research tracking streamed directly from X4: Foundations.',
    color: 'hsl(191deg 100% 50%)',
  },
  {
    icon: '◉',
    title: 'Multi-Screen Setup',
    description: 'Use multiple devices as additional screens. Open the dashboard on tablets, laptops, or side monitors alongside your main display.',
    color: 'hsl(151deg 100% 45%)',
  },
  {
    icon: '▣',
    title: 'Remote Game Control',
    description: 'Interact with X4 directly from the dashboard. Trigger actions, manage settings, and control your ship remotely from any connected device.',
    color: 'hsl(26deg 100% 50%)',
  },
]

export function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="features-container">
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
              ◈ FEATURES
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
              Everything You Need
            </Text>
            <Text
              as="span"
              manager="sequence"
              fixed
              contentStyle={{
                fontSize: '16px',
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'hsl(200deg 20% 70%)',
                fontFamily: "'Exo 2', sans-serif",
                marginTop: '16px',
                maxWidth: '600px',
              }}
            >
              A complete cockpit solution designed for X4: Foundations players who want more from their setup.
            </Text>
          </Animated>
        </Animator>

        <div className="features-grid">
          {features.map((feature, index) => (
            <Animator key={feature.title}>
              <Animated
                as="div"
                className="feature-card"
                animated={['fade', ['y', 20, 0]]}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <FrameCorners
                  style={{
                    '--arwes-frames-line-color': feature.color,
                    '--arwes-frames-bg-color': `${feature.color.replace(')', ' / 5%)')}`,
                    '--arwes-frames-line-filter': `drop-shadow(0 0 6px ${feature.color.replace(')', ' / 40%)')})`,
                  } as React.CSSProperties}
                  animated
                  strokeWidth={1}
                  cornerLength={12}
                />
                <div className="feature-content">
                  <div
                    className="feature-icon"
                    style={{ color: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <Text
                    as="h3"
                    manager="sequence"
                    fixed
                    contentStyle={{
                      fontSize: '18px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      color: 'hsl(200deg 20% 95%)',
                      fontFamily: "'Exo 2', sans-serif",
                      marginBottom: '12px',
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    as="p"
                    manager="sequence"
                    fixed
                    contentStyle={{
                      fontSize: '14px',
                      fontWeight: 300,
                      lineHeight: 1.6,
                      color: 'hsl(200deg 20% 65%)',
                      fontFamily: "'Exo 2', sans-serif",
                    }}
                  >
                    {feature.description}
                  </Text>
                </div>
              </Animated>
            </Animator>
          ))}
        </div>
      </div>
    </section>
  )
}
