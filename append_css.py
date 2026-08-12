css_to_append = """
/* ===== 材质手动映射面板 ===== */
#material-mapper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

#material-mapper-dialog {
  background: #1a1b2e;
  border: 1px solid #3c3c60;
  border-radius: 14px;
  width: 820px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  overflow: hidden;
}

#material-mapper-dialog h3 {
  margin: 0;
  padding: 16px 20px 12px;
  font-size: 15px;
  font-weight: 700;
  color: #e0e0f0;
  border-bottom: 1px solid #2e2e50;
  flex-shrink: 0;
}

#material-mapper-dialog h3 span {
  font-size: 12px;
  font-weight: 400;
  color: #888;
  margin-left: 8px;
}

.mapper-body {
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.mapper-files-panel {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #2e2e50;
  overflow-y: auto;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mapper-files-panel h4 {
  margin: 0 0 6px 0;
  font-size: 11px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.mapper-file-thumb {
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  padding: 4px;
  background: #11121a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.mapper-file-thumb:hover { border-color: #6060c0; box-shadow: 0 0 8px rgba(100,100,220,0.4); }
.mapper-file-thumb.selected { border-color: #7878e0; background: #22234a; box-shadow: 0 0 12px rgba(120,120,224,0.5); }
.mapper-file-thumb.assigned { border-color: #40a060; background: #152218; }

.mapper-file-thumb img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}

.mapper-file-thumb-name {
  font-size: 9px;
  color: #888;
  max-width: 76px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.mapper-file-thumb-badge {
  font-size: 9px;
  background: #40a060;
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  font-weight: 700;
}

.mapper-slots-panel {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
}

.mapper-slots-panel h4 {
  margin: 0 0 4px 0;
  font-size: 11px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mapper-slot-hint {
  font-size: 11px;
  color: #6070a0;
  margin-bottom: 10px;
  line-height: 1.4;
}

.mapper-grid {
  display: grid;
  grid-template-columns: 72px repeat(4, 1fr);
  gap: 4px;
}

.mapper-grid-header {
  font-size: 11px;
  font-weight: 700;
  color: #a0a0c0;
  text-align: center;
  padding: 4px 0;
  background: #11121a;
  border-radius: 4px;
}

.mapper-color-label {
  font-size: 11px;
  font-weight: 700;
  color: #c0c0e0;
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 5px;
}

.mapper-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mapper-slot {
  border: 2px dashed #2e2e50;
  border-radius: 6px;
  min-height: 60px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
  overflow: hidden;
  background: #11121a;
}

.mapper-slot:hover { border-color: #6060c0; background: #17182e; }
.mapper-slot.ready { border-style: solid; border-color: #40a060; background: #121d14; }
.mapper-slot.targeted { border-color: #a0a020; background: #1e1d10; border-style: solid; }

.mapper-slot img { width: 48px; height: 48px; object-fit: contain; }

.mapper-slot-clear {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(200,60,60,0.85);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s;
  line-height: 1;
}

.mapper-slot:hover .mapper-slot-clear { opacity: 1; }

.mapper-slot-empty-text {
  font-size: 10px;
  color: #3a3a60;
  text-align: center;
  padding: 4px;
}

.mapper-footer {
  padding: 12px 20px;
  border-top: 1px solid #2e2e50;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.mapper-progress { flex: 1; font-size: 12px; color: #888; }
.mapper-progress b { color: #a0e0a0; }

.mapper-btn {
  padding: 8px 20px;
  border-radius: 7px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.mapper-btn:active { transform: scale(0.97); }
.mapper-btn-cancel { background: #2e2e50; color: #a0a0c0; }
.mapper-btn-confirm { background: linear-gradient(135deg, #5060d0, #7878f0); color: #fff; box-shadow: 0 4px 14px rgba(80,100,220,0.4); }
.mapper-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
"""

with open('src/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

with open('src/style.css', 'w', encoding='utf-8') as f:
    f.write(content + css_to_append)

print("CSS appended successfully")
