with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

# The current machine head drawing code (no flip)
OLD = (
    "    if (customPropMachineImg) {\n"
    "      const msc = Math.min(machineW / customPropMachineImg.naturalWidth, cellSize / customPropMachineImg.naturalHeight);\n"
    "      const mW = customPropMachineImg.naturalWidth * msc, mH = customPropMachineImg.naturalHeight * msc;\n"
    "      const mX = dir === 'left' ? w2 - machineW + (machineW - mW) / 2 : (machineW - mW) / 2;\n"
    "      cx.drawImage(customPropMachineImg, mX, (cellSize - mH) / 2, mW, mH);\n"
    "    }"
)

# New: horizontal flip when dir === 'right'
NEW = (
    "    if (customPropMachineImg) {\n"
    "      const msc = Math.min(machineW / customPropMachineImg.naturalWidth, cellSize / customPropMachineImg.naturalHeight);\n"
    "      const mW = customPropMachineImg.naturalWidth * msc, mH = customPropMachineImg.naturalHeight * msc;\n"
    "      const mX = dir === 'left' ? w2 - machineW + (machineW - mW) / 2 : (machineW - mW) / 2;\n"
    "      const mY = (cellSize - mH) / 2;\n"
    "      cx.save();\n"
    "      if (dir === 'right') {\n"
    "        // Mirror horizontally so the machine head faces the correct direction\n"
    "        cx.translate(mX + mW, mY);\n"
    "        cx.scale(-1, 1);\n"
    "        cx.drawImage(customPropMachineImg, 0, 0, mW, mH);\n"
    "      } else {\n"
    "        cx.drawImage(customPropMachineImg, mX, mY, mW, mH);\n"
    "      }\n"
    "      cx.restore();\n"
    "    }"
)

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("OK: auto-flip added for dir=right")
else:
    print("ERROR: target not found")
    # Debug
    idx = content.find('customPropMachineImg.naturalWidth, cellSize')
    if idx >= 0:
        print(repr(content[idx-100:idx+300]))
