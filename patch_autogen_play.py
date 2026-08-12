#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Split auto-gen and manual play:
1. Add `autoGenScrollSpeed` variable to store auto-computed speed
2. After auto-gen, save computed speed then RESTORE manual speed
3. Add 3 play buttons in the generator section (HTML + JS)
4. New buttons apply autoGenScrollSpeed before playing
"""
import sys, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

# ─── Patch index.html ─────────────────────────────────────────────────────────
with open('index.html', encoding='utf-8') as f:
    html = f.read()

OLD_STATUS_DIV = '<div id="autoplay-status" style="margin-top: 8px; font-size: 12px; text-align: center; color: #ffaa00; display: none; font-weight: bold; text-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>'

NEW_STATUS_BLOCK = (
    '<div id="autoplay-status" style="margin-top: 8px; font-size: 12px; text-align: center; color: #ffaa00; display: none; font-weight: bold; text-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>\n'
    '        <!-- Auto-gen dedicated play buttons (shown after successful generation) -->\n'
    '        <div id="autogen-play-buttons" style="display:none; flex-direction:column; gap:6px; margin-top:8px;">\n'
    '          <div style="font-size:11px; color:#aaa; text-align:center; margin-bottom:2px;">▼ 使用自动计算的速度播放</div>\n'
    '          <button id="btn-autogen-play" class="btn-apply" style="width:100%; background:linear-gradient(135deg,#1a6aff,#0d3b8c); font-weight:bold; padding:8px; font-size:13px;">▶ 自动播放（固定）</button>\n'
    '          <div style="display:flex; gap:6px;">\n'
    '            <button id="btn-autogen-play-rising" class="btn-apply" style="flex:1; background:linear-gradient(135deg,#1a6aff,#0d3b8c); font-weight:bold; padding:8px; font-size:12px;">▶ 自动播放（上升）</button>\n'
    '            <button id="btn-autogen-play-scroll" class="btn-apply" style="flex:1; background:linear-gradient(135deg,#1a6aff,#0d3b8c); font-weight:bold; padding:8px; font-size:12px;">▶ 自动播放（滚动）</button>\n'
    '          </div>\n'
    '        </div>'
)

if OLD_STATUS_DIV in html:
    html = html.replace(OLD_STATUS_DIV, NEW_STATUS_BLOCK, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("OK: HTML play buttons added in generator section")
else:
    print("ERROR: autoplay-status div not found in HTML"); sys.exit(1)

# ─── Patch main.ts ────────────────────────────────────────────────────────────
with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Add autoGenScrollSpeed variable near propTextureCache declaration
STATE_VAR_ANCHOR = 'let propTextureCache: Record<string, PIXI.Texture> = {};'
if 'let autoGenScrollSpeed' not in ts:
    if STATE_VAR_ANCHOR in ts:
        ts = ts.replace(
            STATE_VAR_ANCHOR,
            STATE_VAR_ANCHOR + '\nlet autoGenScrollSpeed: number | null = null; // speed computed by auto-generator, kept separate from manual speed\n',
            1
        )
        print("OK: autoGenScrollSpeed variable added")
    else:
        print("ERROR: anchor for autoGenScrollSpeed not found"); sys.exit(1)
else:
    print("SKIP: autoGenScrollSpeed already exists")

# 2. In the generator's setTimeout block, before the search,
#    save preSavedSpeed when PARAMS.scrollSpeed = preSpeed is set
PRE_SPEED_LINE = 'PARAMS.scrollSpeed = preSpeed;'
# There are two occurrences: one in the preSpeed calc section and one might exist elsewhere
# We need the one that's followed by speedInput/speedSlider updates in the generator
# Let's find the one near "Pre-adjusted scroll speed"
idx_pre = ts.find('[AutoPlay Generator] Pre-adjusted scroll speed')
if idx_pre >= 0:
    # Find the PARAMS.scrollSpeed = preSpeed before this console.log
    idx_speed_set = ts.rfind(PRE_SPEED_LINE, 0, idx_pre)
    if idx_speed_set >= 0:
        if 'const preSavedManualSpeed' not in ts[max(0,idx_speed_set-500):idx_speed_set]:
            ts = ts[:idx_speed_set] + 'const preSavedManualSpeed = PARAMS.scrollSpeed;\n      ' + ts[idx_speed_set:]
            print("OK: preSavedManualSpeed saved before preSpeed override")
        else:
            print("SKIP: preSavedManualSpeed already saved")
    else:
        print("ERROR: PARAMS.scrollSpeed = preSpeed not found before log")
else:
    print("ERROR: Pre-adjusted log not found"); sys.exit(1)

# Re-read after modification
ts_check = ts  # Continue working with modified ts

# 3. In the success block (after autoAlignPlaybackDuration call),
#    save autoGenScrollSpeed and restore manual speed
OLD_SUCCESS = (
    "        scriptSteps = solvedPath;\n"
    "\n"
    "        autoAlignPlaybackDuration(scriptSteps, targetDuration);\n"
)

NEW_SUCCESS = (
    "        scriptSteps = solvedPath;\n"
    "\n"
    "        autoAlignPlaybackDuration(scriptSteps, targetDuration); // sets PARAMS.scrollSpeed to auto-computed value\n"
    "        autoGenScrollSpeed = PARAMS.scrollSpeed; // save auto-computed speed\n"
    "\n"
    "        // Restore the user's manual speed so manual playback isn't affected\n"
    "        PARAMS.scrollSpeed = preSavedManualSpeed;\n"
    "        const _si2 = document.getElementById('input-speed') as HTMLInputElement;\n"
    "        const _ss2 = document.getElementById('slider-speed') as HTMLInputElement;\n"
    "        const _sv2 = document.getElementById('val-speed');\n"
    "        const _sp2 = document.getElementById('input-script-scroll-speed') as HTMLInputElement;\n"
    "        if (_si2) _si2.value = preSavedManualSpeed.toString();\n"
    "        if (_ss2) _ss2.value = preSavedManualSpeed.toString();\n"
    "        if (_sv2) _sv2.innerText = preSavedManualSpeed.toString();\n"
    "        if (_sp2) _sp2.value = preSavedManualSpeed.toString();\n"
    "\n"
    "        // Show the dedicated auto-gen play buttons\n"
    "        const _agBtns = document.getElementById('autogen-play-buttons');\n"
    "        if (_agBtns) _agBtns.style.display = 'flex';\n"
)

if OLD_SUCCESS in ts:
    ts = ts.replace(OLD_SUCCESS, NEW_SUCCESS, 1)
    print("OK: autoGenScrollSpeed saved + manual speed restored in success block")
else:
    print("ERROR: success block not found")
    idx = ts.find('scriptSteps = solvedPath')
    if idx >= 0:
        print(repr(ts[idx:idx+300]))
    sys.exit(1)

# 4. Add event listeners for the new buttons in bindAutoplayGeneratorEvents
# Insert before the closing of bindAutoplayGeneratorEvents function
# Find "});" at the end of bindAutoplayGeneratorEvents
# The function ends at line 41712 (the closing }); of the click listener)
# then }\n at 41716

OLD_FUNC_END = (
    "  });\n"
    "\n"
    "}\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "// Register generator events when document is ready"
)

NEW_FUNC_END = (
    "  });\n"
    "\n"
    "  // ── Dedicated auto-gen play buttons ──────────────────────────────────\n"
    "  function applyAutoGenSpeedAndPlay(autoScroll: boolean, rising: boolean) {\n"
    "    if (autoGenScrollSpeed === null) { alert('请先点击「自动生成步骤演示」生成演示脚本'); return; }\n"
    "    // Temporarily apply auto-computed speed\n"
    "    const savedSpeed = PARAMS.scrollSpeed;\n"
    "    PARAMS.scrollSpeed = autoGenScrollSpeed;\n"
    "    const _si = document.getElementById('input-speed') as HTMLInputElement;\n"
    "    const _ss = document.getElementById('slider-speed') as HTMLInputElement;\n"
    "    const _sv = document.getElementById('val-speed');\n"
    "    const _sp = document.getElementById('input-script-scroll-speed') as HTMLInputElement;\n"
    "    if (_si) _si.value = autoGenScrollSpeed.toString();\n"
    "    if (_ss) _ss.value = autoGenScrollSpeed.toString();\n"
    "    if (_sv) _sv.innerText = autoGenScrollSpeed.toString();\n"
    "    if (_sp) _sp.value = autoGenScrollSpeed.toString();\n"
    "    playScriptFromButton(autoScroll, rising).finally(() => {\n"
    "      // Restore manual speed after playback\n"
    "      PARAMS.scrollSpeed = savedSpeed;\n"
    "      if (_si) _si.value = savedSpeed.toString();\n"
    "      if (_ss) _ss.value = savedSpeed.toString();\n"
    "      if (_sv) _sv.innerText = savedSpeed.toString();\n"
    "      if (_sp) _sp.value = savedSpeed.toString();\n"
    "    });\n"
    "  }\n"
    "\n"
    "  const btnAgPlay        = document.getElementById('btn-autogen-play');\n"
    "  const btnAgPlayRising  = document.getElementById('btn-autogen-play-rising');\n"
    "  const btnAgPlayScroll  = document.getElementById('btn-autogen-play-scroll');\n"
    "  if (btnAgPlay)       btnAgPlay.addEventListener('click',       () => applyAutoGenSpeedAndPlay(false, false));\n"
    "  if (btnAgPlayRising) btnAgPlayRising.addEventListener('click', () => applyAutoGenSpeedAndPlay(false, true));\n"
    "  if (btnAgPlayScroll) btnAgPlayScroll.addEventListener('click', () => applyAutoGenSpeedAndPlay(true,  false));\n"
    "\n"
    "}\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "\n"
    "// Register generator events when document is ready"
)

if OLD_FUNC_END in ts:
    ts = ts.replace(OLD_FUNC_END, NEW_FUNC_END, 1)
    print("OK: auto-gen play button listeners added to bindAutoplayGeneratorEvents")
else:
    print("ERROR: bindAutoplayGeneratorEvents closing not found")
    # Try to find it
    idx = ts.find("// Register generator events when document is ready")
    if idx >= 0:
        print(repr(ts[idx-200:idx+50]))
    sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
