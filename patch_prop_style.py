#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# ─── Step 1: state + helper functions ─────────────────────────────────────────
if 'customPropMachineImg' not in content:
    STATE_ANCHOR = 'let propTextureCache: Record<string, PIXI.Texture> = {};'
    STATE_NEW = (
        'let propTextureCache: Record<string, PIXI.Texture> = {};\n\n'
        '// Custom prop texture state\n'
        'let customPropMachineImg: HTMLImageElement | null = null;\n'
        'let customPropCandyImg: HTMLImageElement | null = null;\n'
        "const PROP_STORAGE_MACHINE = 'custom_prop_machine_b64';\n"
        "const PROP_STORAGE_CANDY   = 'custom_prop_candy_b64';\n\n"
        'function invalidatePropCache(): void {\n'
        "  Object.keys(propTextureCache).forEach(k => { propTextureCache[k].destroy(true); delete propTextureCache[k]; });\n"
        "  blocks.forEach(b => { if (b.isProp) { const tex = getPropTexture(b.length, b.propDir || 'left'); b.sprite.texture = tex; b.sprite.width = b.length * PARAMS.cellSize; b.sprite.height = PARAMS.cellSize; } });\n"
        '}\n\n'
        'function loadCustomPropImages(): void {\n'
        "  const mb = localStorage.getItem(PROP_STORAGE_MACHINE);\n"
        "  const cb = localStorage.getItem(PROP_STORAGE_CANDY);\n"
        "  if (mb) { const i = new Image(); i.onload = () => { customPropMachineImg = i; invalidatePropCache(); }; i.src = mb; }\n"
        "  if (cb) { const i = new Image(); i.onload = () => { customPropCandyImg   = i; invalidatePropCache(); }; i.src = cb; }\n"
        '}\n\n'
        "async function importPropImage(role: 'machine' | 'candy'): Promise<void> {\n"
        "  return new Promise(resolve => {\n"
        "    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';\n"
        "    input.onchange = () => {\n"
        "      const file = input.files?.[0]; if (!file) return resolve();\n"
        "      const reader = new FileReader();\n"
        "      reader.onload = e => {\n"
        "        const b64 = e.target!.result as string;\n"
        "        const img = new Image();\n"
        "        img.onload = () => {\n"
        "          if (role === 'machine') { customPropMachineImg = img; localStorage.setItem(PROP_STORAGE_MACHINE, b64); }\n"
        "          else                   { customPropCandyImg   = img; localStorage.setItem(PROP_STORAGE_CANDY,   b64); }\n"
        "          invalidatePropCache(); refreshPropStylePanel(); resolve();\n"
        "        }; img.src = b64;\n"
        "      }; reader.readAsDataURL(file);\n"
        "    }; input.click();\n"
        "  });\n"
        '}\n\n'
        'function clearCustomPropImages(): void {\n'
        "  customPropMachineImg = null; customPropCandyImg = null;\n"
        "  localStorage.removeItem(PROP_STORAGE_MACHINE); localStorage.removeItem(PROP_STORAGE_CANDY);\n"
        "  invalidatePropCache(); refreshPropStylePanel();\n"
        '}\n\n'
        'function refreshPropStylePanel(): void {\n'
        "  const mt  = document.getElementById('prop-machine-thumb')       as HTMLImageElement | null;\n"
        "  const ct  = document.getElementById('prop-candy-thumb')         as HTMLImageElement | null;\n"
        "  const mp  = document.getElementById('prop-machine-placeholder') as HTMLElement | null;\n"
        "  const cp  = document.getElementById('prop-candy-placeholder')   as HTMLElement | null;\n"
        "  const btn = document.getElementById('btn-clear-prop-style')     as HTMLButtonElement | null;\n"
        "  const bdg = document.getElementById('prop-custom-badge')        as HTMLElement | null;\n"
        "  if (mt) { mt.src = customPropMachineImg?.src || ''; mt.style.display = customPropMachineImg ? 'block' : 'none'; }\n"
        "  if (ct) { ct.src = customPropCandyImg?.src   || ''; ct.style.display = customPropCandyImg   ? 'block' : 'none'; }\n"
        "  if (mp) mp.style.display = customPropMachineImg ? 'none' : 'block';\n"
        "  if (cp) cp.style.display = customPropCandyImg   ? 'none' : 'block';\n"
        "  const hasCustom = !!(customPropMachineImg || customPropCandyImg);\n"
        "  if (btn) btn.style.display = hasCustom ? 'inline-block' : 'none';\n"
        "  if (bdg) bdg.style.display = hasCustom ? 'inline-block' : 'none';\n"
        '}\n\n'
        'function initPropStylePanel(): void {\n'
        "  const panel = document.getElementById('material-panel');\n"
        "  if (!panel || document.getElementById('prop-style-section')) return;\n"
        "  const sec = document.createElement('div');\n"
        "  sec.id = 'prop-style-section';\n"
        "  sec.style.cssText = 'display:flex;flex-direction:column;border-top:1px solid #444;padding-top:10px;margin-top:4px;';\n"
        "  const lbl_title   = '\U0001F36C \u9053\u5177\u6837\u5f0f';\n"
        "  const lbl_badge   = '\u81ea\u5b9a\u4e49';\n"
        "  const lbl_candy   = '\U0001F36D \u7cd6\u679c\u4f53';\n"
        "  const lbl_machine = '\u2699\ufe0f \u673a\u5668\u5934';\n"
        "  const lbl_clear   = '\u2715 \u6062\u590d\u9ed8\u8ba4\u6837\u5f0f';\n"
        "  const lbl_hint    = '\u7cd6\u679c\u4f53\u56fe\u7247\u5c06<b style=\"color:#aaa\">\u5e73\u94fa\u91cd\u590d</b>\u586b\u5145\uff1b\u673a\u5668\u5934\u56fe\u7247\u56fa\u5b9a\u5728\u53f3\u4fa7 1 \u683c\u3002';\n"
        "  sec.innerHTML = `<h3 style='margin-top:5px;margin-bottom:8px;display:flex;align-items:center;gap:6px;'>${lbl_title}<span id='prop-custom-badge' style='display:none;font-size:10px;background:#7c3aed;color:#fff;padding:1px 6px;border-radius:10px;font-weight:600;'>${lbl_badge}</span></h3><div style='display:flex;flex-direction:column;gap:8px;'><div style='display:flex;gap:8px;align-items:center;'><div id='prop-candy-slot' style='flex:1;background:#1e1e2e;border:1.5px dashed #555;border-radius:8px;padding:6px;text-align:center;cursor:pointer;transition:border-color 0.2s;' onclick='importPropImage(\"candy\")'><div style='font-size:11px;color:#aaa;margin-bottom:4px;'>${lbl_candy}</div><img id='prop-candy-thumb' style='display:none;max-width:100%;max-height:36px;object-fit:contain;border-radius:4px;'/><div id='prop-candy-placeholder' style='font-size:20px;'>+</div></div><div style='font-size:18px;color:#555;'>\u2192</div><div id='prop-machine-slot' style='flex:1;background:#1e1e2e;border:1.5px dashed #555;border-radius:8px;padding:6px;text-align:center;cursor:pointer;transition:border-color 0.2s;' onclick='importPropImage(\"machine\")'><div style='font-size:11px;color:#aaa;margin-bottom:4px;'>${lbl_machine}</div><img id='prop-machine-thumb' style='display:none;max-width:100%;max-height:36px;object-fit:contain;border-radius:4px;'/><div id='prop-machine-placeholder' style='font-size:20px;'>+</div></div></div><button id='btn-clear-prop-style' onclick='clearCustomPropImages()' style='display:none;width:100%;padding:5px;background:#3d1a1a;border:1px solid #7c2d2d;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px;'>${lbl_clear}</button><div style='font-size:10px;color:#666;line-height:1.4;'>${lbl_hint}</div></div>`;\n"
        "  panel.appendChild(sec);\n"
        "  ['prop-candy-slot','prop-machine-slot'].forEach(id => { const el = document.getElementById(id) as HTMLElement|null; if(!el)return; el.addEventListener('mouseenter',()=>el.style.borderColor='#7c3aed'); el.addEventListener('mouseleave',()=>el.style.borderColor='#555'); });\n"
        "  refreshPropStylePanel();\n"
        '}\n'
    )
    if STATE_ANCHOR in content:
        content = content.replace(STATE_ANCHOR, STATE_NEW, 1)
        print("OK: state + helpers injected")
    else:
        print("ERROR: propTextureCache not found"); sys.exit(1)
else:
    print("SKIP: state already exists")

# ─── Step 2: modify getPropTexture ────────────────────────────────────────────
if 'useCustom = !!(customPropMachineImg' not in content:
    # Find using peppermint_ (no template literal confusion)
    SEARCH = 'peppermint_'
    idx = content.find(SEARCH)
    if idx < 0:
        print("ERROR: peppermint_ not found"); sys.exit(1)
    
    # Find the const key line start
    key_start = content.rfind('\n', 0, idx) + 1
    
    # Find end: "const w = length * cellSize;" 
    W_ANCHOR = 'const w = length * cellSize;'
    w_idx = content.find(W_ANCHOR, idx)
    if w_idx < 0:
        print("ERROR: const w not found"); sys.exit(1)
    w_end = w_idx + len(W_ANCHOR)
    
    old_block = content[key_start:w_end]
    print(f"Replacing block ({len(old_block)} chars): {repr(old_block[:80])}")
    
    NEW_BLOCK = (
        "  const useCustom = !!(customPropMachineImg && customPropCandyImg);\n"
        "  const key = `peppermint_${length}_${dir}_${cellSize}_${useCustom ? 'c' : 'd'}`;\n"
        "  if (propTextureCache[key]) return propTextureCache[key];\n\n"
        "  if (useCustom) {\n"
        "    const w2 = length * cellSize, h2 = cellSize;\n"
        "    const cv = document.createElement('canvas'); cv.width = w2; cv.height = h2;\n"
        "    const cx = cv.getContext('2d')!;\n"
        "    const machineW = cellSize, candyW = Math.max(0, w2 - machineW);\n"
        "    if (candyW > 0 && customPropCandyImg) {\n"
        "      const sc = cellSize / customPropCandyImg.naturalHeight;\n"
        "      const tw = Math.max(1, Math.ceil(customPropCandyImg.naturalWidth * sc));\n"
        "      const tc = document.createElement('canvas'); tc.width = tw; tc.height = cellSize;\n"
        "      tc.getContext('2d')!.drawImage(customPropCandyImg, 0, 0, tw, cellSize);\n"
        "      const pat = cx.createPattern(tc, 'repeat-x');\n"
        "      if (pat) {\n"
        "        cx.save(); cx.beginPath();\n"
        "        if (dir === 'left') { cx.rect(0, 0, candyW, h2); }\n"
        "        else { cx.translate(machineW, 0); cx.rect(0, 0, candyW, h2); }\n"
        "        cx.clip(); cx.fillStyle = pat; cx.fillRect(0, 0, candyW, h2); cx.restore();\n"
        "      }\n"
        "    }\n"
        "    if (customPropMachineImg) {\n"
        "      const msc = Math.min(machineW / customPropMachineImg.naturalWidth, cellSize / customPropMachineImg.naturalHeight);\n"
        "      const mW = customPropMachineImg.naturalWidth * msc, mH = customPropMachineImg.naturalHeight * msc;\n"
        "      const mX = dir === 'left' ? w2 - machineW + (machineW - mW) / 2 : (machineW - mW) / 2;\n"
        "      cx.drawImage(customPropMachineImg, mX, (cellSize - mH) / 2, mW, mH);\n"
        "    }\n"
        "    const t2 = PIXI.Texture.from(cv); propTextureCache[key] = t2; return t2;\n"
        "  }\n\n"
        "  const w = length * cellSize;"
    )
    content = content[:key_start] + NEW_BLOCK + content[w_end:]
    print("OK: getPropTexture custom path inserted")
else:
    print("SKIP: getPropTexture already patched")

# ─── Step 3: window exports + init calls ──────────────────────────────────────
EXPOSE_ANCHOR = '  (window as any).parseMaterialTextureName'
if '(window as any).importPropImage' not in content and EXPOSE_ANCHOR in content:
    content = content.replace(
        EXPOSE_ANCHOR,
        "  (window as any).importPropImage      = (role: 'machine'|'candy') => importPropImage(role);\n"
        "  (window as any).clearCustomPropImages = clearCustomPropImages;\n"
        "  (window as any).parseMaterialTextureName",
        1
    )
    print("OK: window exports added")
else:
    print("SKIP: window exports")

if 'loadCustomPropImages()' not in content:
    LOAD_ANCHOR = '  (window as any).importPropImage'
    if LOAD_ANCHOR in content:
        content = content.replace(
            LOAD_ANCHOR,
            '  loadCustomPropImages();\n  setTimeout(() => { initPropStylePanel(); }, 600);\n  (window as any).importPropImage',
            1
        )
        print("OK: init calls added")
else:
    print("SKIP: init calls")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
