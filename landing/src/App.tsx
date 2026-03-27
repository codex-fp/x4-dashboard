import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Animator, Animated, Text } from '@arwes/react'
import { HeroSection } from './components/HeroSection'
import { FeaturesSection } from './components/FeaturesSection'
import { Footer } from './components/Footer'
import { GuidePage } from './components/GuidePage'
import './App.css'

// GitHub icon component
function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

// Main landing page content
function LandingPage({ onGuideClick }: { onGuideClick: () => void }) {
  return (
    <>
      <HeroSection onGuideClick={onGuideClick} />
      <FeaturesSection />
    </>
  )
}

// App content with routing
function AppContent() {
  const navigate = useNavigate()
  const [guideContent, setGuideContent] = useState('')

  useEffect(() => {
    // Fetch the player guide markdown content from GitHub
    fetch('https://raw.githubusercontent.com/fpiechowski/x4-dashboard/master/docs/player-guide.md')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load guide')
        }
        return res.text()
      })
      .then((text) => setGuideContent(text))
      .catch(() => {
        // Fallback content if fetch fails
        setGuideContent(`# Player Setup Guide

> The easiest way to install, launch, and use \`x4-dashboard\` from a packaged GitHub release.

This guide is written for players, not developers. It focuses on the Windows Server Launcher and the packaged Lua bridge mod, so you do not need to build the project from source.

## What you need

- A Windows PC that runs \`X4: Foundations\`
- The latest release files from [GitHub Releases](https://github.com/fpiechowski/x4-dashboard/releases)
- A trusted home LAN if you want to open the dashboard on another device
- AutoHotkey v2 on Windows if you want the most reliable host-side key presses

## 1. Download the release files

From the latest GitHub release, download:

- one Server Launcher build:
  - \`x4-dashboard-server-launcher-<version>-setup.exe\` for a normal install
  - \`x4-dashboard-server-launcher-<version>-portable.exe\` if you prefer a portable app
- \`x4-dashboard-lua-mod-<version>.zip\`

If you are using the Server Launcher, you do not need the standalone server bundle.

## 2. Install and open the Server Launcher

1. Run the installer or open the portable launcher.
2. Start \`x4-dashboard\`.
3. Wait until the launcher shows the server as \`Online\`.
4. Keep the launcher open while you play.

The launcher shows two browser addresses:

- \`Local URL\` for the same machine that runs X4 and the launcher
- \`LAN URL\` for tablets, laptops, or other devices on the same trusted network

If the LAN URL is unavailable, the host machine is not exposing a usable LAN address yet. The local URL should still work on the host PC.

## 3. Install the Lua bridge mod

1. Unzip \`x4-dashboard-lua-mod-<version>.zip\`.
2. Copy the included \`x4_dashboard_bridge\` folder into your X4 \`extensions\` directory.
3. Make sure the final folder looks like this:

\`\`\`text
X4 Foundations/extensions/x4_dashboard_bridge/
\`\`\`

Avoid ending up with a doubled folder like \`x4_dashboard_bridge/x4_dashboard_bridge/\`.

### Default host settings

Inside the mod folder, the default bridge config is \`x4_dashboard_bridge/ui/config.lua\`:

\`\`\`lua
host = '127.0.0.1'
port = 3001
\`\`\`

Leave these values as-is when X4 and the Server Launcher run on the same PC.

Only change \`host\` when the game sends data to a different machine on your LAN. In that case, copy only the address part from the launcher's LAN URL, such as \`192.168.1.50\`, and keep the same port unless you changed it on purpose.

## 4. Open the dashboard

- On the host PC, open the \`Local URL\` shown by the launcher.
- On another device, open the \`LAN URL\` shown by the launcher.
- The dashboard is browser-based, so you do not install a separate client on your phone, tablet, or second laptop.

You can view the dashboard from other LAN devices without enabling remote controls.

## 5. Configure controls once in the launcher

The launcher is where host-side control settings live.

- Add key bindings for the actions you want to trigger from the dashboard
- Leave \`Allow remote controls\` off unless you want another LAN device to send controls to the host PC
- Turn on \`Force activate game window\` if X4 needs help getting focus before a key press
- Change \`Game window title\` only if the launcher cannot find the X4 window with the default value
- Fill in \`AutoHotkey path\` only if AutoHotkey is installed but was not detected automatically

Important:

- Dashboard buttons with no key binding stay disabled
- LAN viewing works without remote controls, but LAN control input does not
- AutoHotkey is optional, but recommended on Windows for more reliable in-game input

## 6. Verify your first successful control action

Do this once after setup so you know the full path is working:

1. Start the Server Launcher.
2. Start X4 with the bridge mod installed.
3. Open the dashboard in a browser and confirm you are seeing real game data.
4. Bring X4 to the foreground, or enable \`Force activate game window\` in the launcher.
5. Click a dashboard action that has a key binding, such as \`Flight Assist\` or \`Map\`.
6. Confirm that the action happens inside X4.

For \`Flight Assist\`, a good success signal is that the game reacts and the dashboard state can switch between \`ON\` and \`OFF\`.

Do not treat launcher-only signals as final proof. Seeing \`Online\`, a saved key binding, or a visible URL only means part of the setup works. The setup is only complete when the action actually happens in X4.

## Troubleshooting

### The dashboard opens, but I do not see live game data

- Check that the mod folder is in the correct \`extensions\` location
- Check that the final folder name is exactly \`x4_dashboard_bridge\`
- Check \`x4_dashboard_bridge/ui/config.lua\` if the game sends data to another machine
- Reopen the launcher and look for bridge detection status

### I can open the dashboard on another device, but controls do nothing

- This is expected until \`Allow remote controls\` is enabled
- Only enable it on a trusted local network
- If you only want to view the dashboard, leave it off

### A dashboard button is disabled

- Configure a key binding for that action in the Server Launcher first

### A dashboard button flashes, but X4 does not react

- Make sure X4 is running on the same host machine that sends the key press
- Bring X4 to the front, or turn on \`Force activate game window\`
- Check whether AutoHotkey is detected in the launcher
- If needed, point \`AutoHotkey path\` to your \`AutoHotkey64.exe\`

### The LAN URL is missing

- Use the local URL on the host PC
- Connect the host machine to your trusted local network if you want second-device access

## Recommended first session

For the smoothest first run:

1. Use the host PC first with the \`Local URL\`.
2. Confirm one successful control action in X4.
3. Move to a tablet or second screen with the \`LAN URL\`.
4. Enable remote controls only if that second device also needs to trigger inputs.

Once this works, you can keep the launcher running on the host PC and use the dashboard from browsers wherever it fits your cockpit setup best.`)
      })
  }, [])

  const handleGuideClick = () => {
    navigate('/guide')
  }

  return (
    <div className="app">
      <Animator combine active>
        <Animated
          as="div"
          className="app-background"
          animated={['fade']}
        >
          <div className="stars-bg" />
        </Animated>
      </Animator>

      <header className="app-header">
        <Animator active>
          <Animated
            as="div"
            className="header-content"
            animated={['fade', ['y', -20, 0]]}
          >
            <div className="logo">
              <Text
                as="span"
                manager="sequence"
                fixed
                contentStyle={{
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '4px',
                  color: 'hsl(191deg 100% 50%)',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                ◈ X4 DASHBOARD
              </Text>
            </div>
            <nav className="header-nav">
              <a href="/#features">Features</a>
              <a
                href="https://github.com/fpiechowski/x4-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
                aria-label="View on GitHub"
              >
                <GitHubIcon />
              </a>
            </nav>
          </Animated>
        </Animator>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={<LandingPage onGuideClick={handleGuideClick} />}
          />
          <Route
            path="/guide"
            element={<GuidePage content={guideContent} />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/x4-dashboard">
      <AppContent />
    </BrowserRouter>
  )
}

export default App
