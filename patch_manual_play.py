#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    ts = f.read()

# 1. Declare isPlayingAutoGenScript
DECL_ANCHOR = 'let autoGenScrollSpeed: number | null = null;'
if 'let isPlayingAutoGenScript' not in ts:
    if DECL_ANCHOR in ts:
        ts = ts.replace(DECL_ANCHOR, DECL_ANCHOR + '\nlet isPlayingAutoGenScript = false;\n', 1)
        print("OK: isPlayingAutoGenScript declared")
    else:
        print("ERROR: DECL_ANCHOR not found"); sys.exit(1)
else:
    print("SKIP: isPlayingAutoGenScript already declared")

# 2. updateGameLoop modifications
# Change proportional speed controller condition
OLD_CTRL = 'if (isPlayingScript && blocks.length > 0) {\n\n\n\n        // ===== Bidirectional proportional speed controller ====='
NEW_CTRL = 'if (isPlayingAutoGenScript && blocks.length > 0) {\n\n\n\n        // ===== Bidirectional proportional speed controller ====='

# Find roughly the area
if OLD_CTRL in ts:
    ts = ts.replace(OLD_CTRL, NEW_CTRL, 1)
    print("OK: Proportional controller condition updated")
else:
    # Try a more flexible replace
    idx = ts.find('// ===== Bidirectional proportional speed controller =====')
    if idx > 0:
        idx_if = ts.rfind('if (isPlayingScript && blocks.length > 0) {', 0, idx)
        if idx_if > 0:
            ts = ts[:idx_if] + 'if (isPlayingAutoGenScript && blocks.length > 0) {' + ts[idx_if + len('if (isPlayingScript && blocks.length > 0) {'):]
            print("OK: Proportional controller condition updated (flexible)")
        else:
            print("ERROR: proportional if condition not found"); sys.exit(1)
    else:
        print("ERROR: proportional controller comment not found"); sys.exit(1)

# Change game over condition
OLD_GO = 'const isGameOver = !isPlayingScript && !isPlayingStepTransition && !isAnimating && topBlockReached;'
NEW_GO = 'const isGameOver = !isPlayingAutoGenScript && !isPlayingStepTransition && !isAnimating && topBlockReached;'
if OLD_GO in ts:
    ts = ts.replace(OLD_GO, NEW_GO, 1)
    print("OK: Game over condition updated")
else:
    print("ERROR: Game over condition not found"); sys.exit(1)

# 3. Modify applyAutoGenSpeedAndPlay to set/unset isPlayingAutoGenScript
OLD_FUNC = 'function applyAutoGenSpeedAndPlay(autoScroll: boolean, rising: boolean): void {\n    if (autoGenScrollSpeed === null) { alert(\'请先点击「自动生成步骤演示」生成演示脚本\'); return; }\n    const savedSpeed = PARAMS.scrollSpeed;\n    PARAMS.scrollSpeed = autoGenScrollSpeed;'

NEW_FUNC = 'function applyAutoGenSpeedAndPlay(autoScroll: boolean, rising: boolean): void {\n    if (autoGenScrollSpeed === null) { alert(\'请先点击「自动生成步骤演示」生成演示脚本\'); return; }\n    isPlayingAutoGenScript = true;\n    const savedSpeed = PARAMS.scrollSpeed;\n    PARAMS.scrollSpeed = autoGenScrollSpeed;'

if OLD_FUNC in ts:
    ts = ts.replace(OLD_FUNC, NEW_FUNC, 1)
    print("OK: applyAutoGenSpeedAndPlay modified (set true)")
else:
    print("ERROR: applyAutoGenSpeedAndPlay not found")
    idx = ts.find('function applyAutoGenSpeedAndPlay')
    if idx >= 0:
        print(repr(ts[idx:idx+300]))
    sys.exit(1)

# Find the finally block inside applyAutoGenSpeedAndPlay
OLD_FINALLY = (
    '    playScriptFromButton(autoScroll, rising).finally(() => {\n'
    '      PARAMS.scrollSpeed = savedSpeed;\n'
)
NEW_FINALLY = (
    '    playScriptFromButton(autoScroll, rising).finally(() => {\n'
    '      isPlayingAutoGenScript = false;\n'
    '      PARAMS.scrollSpeed = savedSpeed;\n'
)

if OLD_FINALLY in ts:
    ts = ts.replace(OLD_FINALLY, NEW_FINALLY, 1)
    print("OK: applyAutoGenSpeedAndPlay finally modified (set false)")
else:
    print("ERROR: applyAutoGenSpeedAndPlay finally not found"); sys.exit(1)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print("Done.")
