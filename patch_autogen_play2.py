#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# Find the success block using piecewise search
# Find 'scriptSteps = solvedPath;' followed (eventually) by 'autoAlignPlaybackDuration'
idx_solved = ts.find('scriptSteps = solvedPath;')
if idx_solved < 0:
    print("ERROR: scriptSteps = solvedPath not found"); sys.exit(1)

idx_align = ts.find('autoAlignPlaybackDuration(scriptSteps, targetDuration);', idx_solved)
if idx_align < 0:
    print("ERROR: autoAlignPlaybackDuration call not found"); sys.exit(1)

if 'autoGenScrollSpeed = PARAMS.scrollSpeed' in ts:
    print("SKIP: success block already patched")
else:
    # The text between idx_solved-end and idx_align-end (the full call line)
    align_end = idx_align + len('autoAlignPlaybackDuration(scriptSteps, targetDuration);')
    
    INSERT = (
        ' // sets PARAMS.scrollSpeed to auto-computed value\n'
        '        autoGenScrollSpeed = PARAMS.scrollSpeed; // save auto-computed speed\n'
        '\n'
        '        // Restore the user\'s manual speed so manual playback is not affected\n'
        '        PARAMS.scrollSpeed = preSavedManualSpeed;\n'
        '        const _si2 = document.getElementById(\'input-speed\') as HTMLInputElement;\n'
        '        const _ss2 = document.getElementById(\'slider-speed\') as HTMLInputElement;\n'
        '        const _sv2 = document.getElementById(\'val-speed\');\n'
        '        const _sp2 = document.getElementById(\'input-script-scroll-speed\') as HTMLInputElement;\n'
        '        if (_si2) _si2.value = preSavedManualSpeed.toString();\n'
        '        if (_ss2) _ss2.value = preSavedManualSpeed.toString();\n'
        '        if (_sv2) _sv2.innerText = preSavedManualSpeed.toString();\n'
        '        if (_sp2) _sp2.value = preSavedManualSpeed.toString();\n'
        '        // Show the dedicated auto-gen play buttons\n'
        '        const _agBtns = document.getElementById(\'autogen-play-buttons\');\n'
        '        if (_agBtns) _agBtns.style.display = \'flex\';\n'
    )
    
    ts = ts[:align_end] + INSERT + ts[align_end:]
    print("OK: autoGenScrollSpeed saved + manual speed restored in success block")

# Now add button event listeners in bindAutoplayGeneratorEvents
if 'btn-autogen-play' not in ts:
    FUNC_END_ANCHOR = '// Register generator events when document is ready'
    idx_end = ts.rfind(FUNC_END_ANCHOR)
    if idx_end < 0:
        print("ERROR: register anchor not found"); sys.exit(1)
    
    # Find the closing } of the function (should be just before the anchor)
    # Look for "}\n\n" pattern before the anchor
    close_idx = ts.rfind('}\n', 0, idx_end)
    if close_idx < 0:
        print("ERROR: function closing brace not found"); sys.exit(1)
    
    BUTTON_LISTENERS = (
        '\n'
        '  // ── Dedicated auto-gen play buttons ──────────────────────────────────\n'
        '  function applyAutoGenSpeedAndPlay(autoScroll: boolean, rising: boolean): void {\n'
        '    if (autoGenScrollSpeed === null) { alert(\'请先点击「自动生成步骤演示」生成演示脚本\'); return; }\n'
        '    const savedSpeed = PARAMS.scrollSpeed;\n'
        '    PARAMS.scrollSpeed = autoGenScrollSpeed;\n'
        '    const _si = document.getElementById(\'input-speed\') as HTMLInputElement;\n'
        '    const _ss3 = document.getElementById(\'slider-speed\') as HTMLInputElement;\n'
        '    const _sv3 = document.getElementById(\'val-speed\');\n'
        '    const _sp3 = document.getElementById(\'input-script-scroll-speed\') as HTMLInputElement;\n'
        '    if (_si) _si.value = autoGenScrollSpeed.toString();\n'
        '    if (_ss3) _ss3.value = autoGenScrollSpeed.toString();\n'
        '    if (_sv3) _sv3.innerText = autoGenScrollSpeed.toString();\n'
        '    if (_sp3) _sp3.value = autoGenScrollSpeed.toString();\n'
        '    playScriptFromButton(autoScroll, rising).finally(() => {\n'
        '      PARAMS.scrollSpeed = savedSpeed;\n'
        '      if (_si) _si.value = savedSpeed.toString();\n'
        '      if (_ss3) _ss3.value = savedSpeed.toString();\n'
        '      if (_sv3) _sv3.innerText = savedSpeed.toString();\n'
        '      if (_sp3) _sp3.value = savedSpeed.toString();\n'
        '    });\n'
        '  }\n'
        '  const btnAgPlay       = document.getElementById(\'btn-autogen-play\');\n'
        '  const btnAgPlayRising = document.getElementById(\'btn-autogen-play-rising\');\n'
        '  const btnAgPlayScroll = document.getElementById(\'btn-autogen-play-scroll\');\n'
        '  if (btnAgPlay)       btnAgPlay.addEventListener(\'click\',       () => applyAutoGenSpeedAndPlay(false, false));\n'
        '  if (btnAgPlayRising) btnAgPlayRising.addEventListener(\'click\', () => applyAutoGenSpeedAndPlay(false, true));\n'
        '  if (btnAgPlayScroll) btnAgPlayScroll.addEventListener(\'click\', () => applyAutoGenSpeedAndPlay(true,  false));\n'
    )
    
    ts = ts[:close_idx] + BUTTON_LISTENERS + '\n' + ts[close_idx:]
    print("OK: auto-gen play button listeners added")
else:
    print("SKIP: button listeners already present")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
