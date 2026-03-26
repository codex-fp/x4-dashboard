import { useNavigate } from 'react-router-dom'
import { Animator, Animated, Text, FrameCorners } from '@arwes/react'
import ReactMarkdown from 'react-markdown'
import './GuidePage.css'

interface GuidePageProps {
  content: string
}

export function GuidePage({ content }: GuidePageProps) {
  const navigate = useNavigate()
  return (
    <div className="guide-page">
      <div className="guide-container">
        <Animator>
          <Animated
            as="div"
            className="guide-header"
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
              ◈ PLAYER GUIDE
            </Text>
            <Text
              as="h1"
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
              Player Setup Guide
            </Text>
          </Animated>
        </Animator>

        <Animator>
          <Animated
            as="div"
            className="guide-content-wrapper"
            animated={['fade', ['y', 20, 0]]}
            style={{ animationDelay: '0.1s' }}
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
            <div className="guide-content">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <Text
                      as="h1"
                      manager="sequence"
                      fixed
                      contentStyle={{
                        fontSize: '28px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        color: 'hsl(200deg 20% 95%)',
                        fontFamily: "'Exo 2', sans-serif",
                        marginBottom: '16px',
                        marginTop: '32px',
                      }}
                    >
                      {children}
                    </Text>
                  ),
                  h2: ({ children }) => (
                    <Text
                      as="h2"
                      manager="sequence"
                      fixed
                      contentStyle={{
                        fontSize: '22px',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        color: 'hsl(191deg 100% 50%)',
                        fontFamily: "'Exo 2', sans-serif",
                        marginBottom: '12px',
                        marginTop: '28px',
                      }}
                    >
                      {children}
                    </Text>
                  ),
                  h3: ({ children }) => (
                    <Text
                      as="h3"
                      manager="sequence"
                      fixed
                      contentStyle={{
                        fontSize: '18px',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        color: 'hsl(200deg 20% 90%)',
                        fontFamily: "'Exo 2', sans-serif",
                        marginBottom: '8px',
                        marginTop: '20px',
                      }}
                    >
                      {children}
                    </Text>
                  ),
                  p: ({ children }) => (
                    <Text
                      as="p"
                      manager="sequence"
                      fixed
                      contentStyle={{
                        fontSize: '15px',
                        fontWeight: 300,
                        lineHeight: 1.7,
                        color: 'hsl(200deg 20% 75%)',
                        fontFamily: "'Exo 2', sans-serif",
                        marginBottom: '16px',
                      }}
                    >
                      {children}
                    </Text>
                  ),
                  ul: ({ children }) => (
                    <ul className="guide-list">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="guide-ordered-list">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="guide-list-item">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className="guide-code">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="guide-pre">{children}</pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="guide-blockquote">{children}</blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="guide-link"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </Animated>
        </Animator>

        <Animator>
          <Animated
            as="div"
            className="guide-footer"
            animated={['fade']}
            style={{ animationDelay: '0.2s' }}
          >
            <button
              onClick={() => navigate('/')}
              className="guide-back-link"
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
                ← Back to Home
              </Text>
            </button>
          </Animated>
        </Animator>
      </div>
    </div>
  )
}
