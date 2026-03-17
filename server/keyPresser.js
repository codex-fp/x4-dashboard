/**
 * Key Press Simulation
 * Uses Windows PowerShell SendKeys for key press simulation on Windows.
 * For Linux, uses xdotool. For macOS, uses osascript.
 *
 * SendKeys format:
 *   {F1}-{F12}  - Function keys
 *   ^key        - Ctrl+key
 *   +key        - Shift+key
 *   %key        - Alt+key
 *   {ENTER}, {ESC}, {TAB}, {SPACE}, {DELETE}, {BACKSPACE}
 *   {UP}, {DOWN}, {LEFT}, {RIGHT}, {HOME}, {END}, {PGUP}, {PGDN}
 */

const { exec, execFile } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { readRuntimeConfig } = require('./runtimeConfigStore');

function getWindowsRuntimeSettings() {
  const runtimeConfig = readRuntimeConfig();

  return {
    autoHotkeyExecutables: [
      runtimeConfig.autoHotkeyPath,
      'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe',
      'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey32.exe',
      'C:\\Program Files\\AutoHotkey\\AutoHotkey.exe',
    ].filter(Boolean),
    forceActivateGameWindow: runtimeConfig.forceActivateGameWindow,
    gameWindowTitle: runtimeConfig.gameWindowTitle,
  };
}

/**
 * Press a key on the host machine.
 * @param {string} key - Key in SendKeys format
 * @param {string[]} modifiers - Additional modifiers ['ctrl', 'shift', 'alt']
 */
function press(key, modifiers = []) {
  if (!key || key.trim() === '') {
    console.warn('[KeyPresser] No key specified');
    return;
  }

  let keyString = key;

  if (modifiers.includes('alt')) keyString = '%' + keyString;
  if (modifiers.includes('shift')) keyString = '+' + keyString;
  if (modifiers.includes('ctrl') || modifiers.includes('control')) keyString = '^' + keyString;

  const platform = os.platform();

  if (platform === 'win32') {
    pressWindows(keyString);
  } else if (platform === 'linux') {
    pressLinux(keyString);
  } else if (platform === 'darwin') {
    pressMac(keyString);
  } else {
    console.warn(`[KeyPresser] Platform '${platform}' not supported`);
  }
}

function pressWindows(keyString) {
  const settings = getWindowsRuntimeSettings();
  const ahkExecutable = getAutoHotkeyExecutable(settings.autoHotkeyExecutables);

  if (ahkExecutable) {
    pressWindowsWithAutoHotkey(ahkExecutable, keyString, settings);
    return;
  }

  const escapedKey = keyString.replace(/'/g, "''");
  const escapedWindowMatch = settings.gameWindowTitle.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    '$shell = New-Object -ComObject WScript.Shell',
    `if (${settings.forceActivateGameWindow ? '$true' : '$false'}) {`,
    `  $windowMatch = '${escapedWindowMatch}'`,
    "  $target = Get-Process | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -like ('*' + $windowMatch + '*') } | Select-Object -First 1",
    "  if (-not $target) { throw 'No matching game window found' }",
    "  if (-not $shell.AppActivate($target.Id)) { throw 'Failed to activate game window' }",
    '  Start-Sleep -Milliseconds 100',
    '}',
    `$shell.SendKeys('${escapedKey}')`,
  ].join('; ');
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64');

  exec(`powershell -NoProfile -NonInteractive -EncodedCommand ${encodedScript}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`[KeyPresser] Windows key press error: ${err.message}`);
      if (stderr && stderr.trim()) {
        console.error(`[KeyPresser] PowerShell: ${stderr.trim()}`);
      }
    } else {
      const activateNote = settings.forceActivateGameWindow ? ` -> ${settings.gameWindowTitle}` : '';
      console.log(`[KeyPresser] Pressed: ${keyString}${activateNote}`);
    }
  });
}

function pressWindowsWithAutoHotkey(ahkExecutable, keyString, settings) {
  const ahkKey = toAutoHotkeyKey(keyString);
  if (!ahkKey) {
    console.error(`[KeyPresser] Unsupported AutoHotkey binding: ${keyString}`);
    return;
  }

  const scriptPath = path.join(os.tmpdir(), `x4-dashboard-${Date.now()}-${Math.random().toString(36).slice(2)}.ahk`);
  const ahkLines = [
    '#Requires AutoHotkey v2.0',
    'SetKeyDelay 50, 50',
    'SetControlDelay 50',
    'SetWinDelay 50',
  ];

  if (settings.forceActivateGameWindow) {
    const escapedTitle = settings.gameWindowTitle.replace(/`/g, '``');
    ahkLines.push(`if WinExist("${escapedTitle}") {`);
    ahkLines.push(`  WinActivate("${escapedTitle}")`);
    ahkLines.push(`  WinWaitActive("${escapedTitle}",, 1)`);
    ahkLines.push('}');
  }

  ahkLines.push(`SendEvent "${ahkKey}"`);

  fs.writeFileSync(scriptPath, ahkLines.join('\n'));

  execFile(ahkExecutable, [scriptPath], (err, stdout, stderr) => {
    try {
      fs.unlinkSync(scriptPath);
    } catch {}

    if (err) {
      console.error(`[KeyPresser] AutoHotkey error: ${err.message}`);
      if (stderr && stderr.trim()) {
        console.error(`[KeyPresser] AutoHotkey stderr: ${stderr.trim()}`);
      }
      return;
    }

    const activateNote = settings.forceActivateGameWindow ? ` -> ${settings.gameWindowTitle}` : '';
    console.log(`[KeyPresser] Pressed (AutoHotkey): ${keyString}${activateNote}`);
  });
}

function getAutoHotkeyExecutable(candidates) {
  for (const executable of candidates) {
    if (executable && fs.existsSync(executable)) {
      return executable;
    }
  }

  return null;
}

function toAutoHotkeyKey(keyString) {
  let result = keyString;

  while (result.startsWith('%')) {
    result = '!' + result.slice(1);
  }

  return result.replace(/\{ESC\}/gi, '{Escape}').replace(/\{SPACE\}/gi, '{Space}');
}

function pressLinux(keyString) {
  const xdotoolKey = sendKeysToXdotool(keyString);
  exec(`xdotool key --clearmodifiers ${xdotoolKey}`, (err) => {
    if (err) {
      console.error(`[KeyPresser] Linux xdotool error: ${err.message}`);
      console.log('[KeyPresser] Make sure xdotool is installed: sudo apt install xdotool');
    } else {
      console.log(`[KeyPresser] Pressed (xdotool): ${xdotoolKey}`);
    }
  });
}

function pressMac(keyString) {
  const appleKey = sendKeysToAppleScript(keyString);
  exec(`osascript -e 'tell application "System Events" to key code ${appleKey}'`, (err) => {
    if (err) {
      console.error(`[KeyPresser] macOS osascript error: ${err.message}`);
    } else {
      console.log(`[KeyPresser] Pressed (osascript): ${appleKey}`);
    }
  });
}

function sendKeysToXdotool(key) {
  const fkeyMap = {
    '{F1}': 'F1', '{F2}': 'F2', '{F3}': 'F3', '{F4}': 'F4',
    '{F5}': 'F5', '{F6}': 'F6', '{F7}': 'F7', '{F8}': 'F8',
    '{F9}': 'F9', '{F10}': 'F10', '{F11}': 'F11', '{F12}': 'F12',
    '{ENTER}': 'Return', '{ESC}': 'Escape', '{ESCAPE}': 'Escape',
    '{TAB}': 'Tab', '{SPACE}': 'space', '{BACKSPACE}': 'BackSpace',
    '{DELETE}': 'Delete', '{DEL}': 'Delete',
    '{HOME}': 'Home', '{END}': 'End',
    '{UP}': 'Up', '{DOWN}': 'Down', '{LEFT}': 'Left', '{RIGHT}': 'Right',
    '{PGUP}': 'Prior', '{PGDN}': 'Next',
    '{INSERT}': 'Insert',
  };

  let result = key;
  let modifiers = '';

  while (result.startsWith('^') || result.startsWith('+') || result.startsWith('%')) {
    if (result.startsWith('^')) { modifiers += 'ctrl+'; result = result.slice(1); }
    else if (result.startsWith('+')) { modifiers += 'shift+'; result = result.slice(1); }
    else if (result.startsWith('%')) { modifiers += 'alt+'; result = result.slice(1); }
  }

  for (const [sendKey, xdoKey] of Object.entries(fkeyMap)) {
    if (result.toUpperCase() === sendKey) {
      return modifiers + xdoKey;
    }
  }

  return modifiers + result;
}

function sendKeysToAppleScript(key) {
  const fkeyMap = {
    '{F1}': '122', '{F2}': '120', '{F3}': '99', '{F4}': '118',
    '{F5}': '96', '{F6}': '97', '{F7}': '98', '{F8}': '100',
    '{F9}': '101', '{F10}': '109', '{F11}': '103', '{F12}': '111',
  };
  return fkeyMap[key.toUpperCase()] || '0';
}

module.exports = { press };
