with open('src/main.ts', encoding='utf-8') as f:
    content = f.read()

print("customPropMachineImg state:", 'customPropMachineImg' in content)
print("invalidatePropCache:", 'function invalidatePropCache' in content)
print("loadCustomPropImages:", 'function loadCustomPropImages' in content)
print("importPropImage:", 'function importPropImage' in content)
print("initPropStylePanel:", 'function initPropStylePanel' in content)
print("useCustom in getPropTexture:", 'useCustom = !!(customPropMachineImg' in content)
print("window.importPropImage:", "(window as any).importPropImage" in content)
print("loadCustomPropImages call:", "loadCustomPropImages();" in content)
