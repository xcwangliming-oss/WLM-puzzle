MAPPER_FUNC = r"""
// ---- 材质手动映射对话框 ----
// 当文件名无法自动识别时，展示此对话框让用户手动将图片分配到对应颜色+格数的槽位
async function showMaterialMapperDialog(files: File[]): Promise<Record<string, string> | null> {
  const COLORS = [
    { key: 'red', label: '红色', dot: '#e05050' },
    { key: 'blue', label: '蓝色', dot: '#5080e0' },
    { key: 'green', label: '绿色', dot: '#50c050' },
    { key: 'yellow', label: '黄色', dot: '#e0c040' },
    { key: 'pink', label: '粉色', dot: '#e060a0' },
  ];
  const LENGTHS = [1, 2, 3, 4];

  // 只保留图片类型文件
  const imgFiles = files.filter(f => /\.(png|jpe?g|webp)$/i.test(f.name));
  if (imgFiles.length === 0) return null;

  // 预先生成 object URL
  const fileUrls = imgFiles.map(f => ({ file: f, url: URL.createObjectURL(f) }));

  return new Promise<Record<string, string> | null>((resolve) => {
    // slot map: key = "color-length", value = index into fileUrls
    const slotMap: Record<string, number> = {};
    // reverse: fileIdx -> slotKey
    const fileSlotMap: Record<number, string> = {};
    let selectedFileIdx: number | null = null;

    const overlay = document.createElement('div');
    overlay.id = 'material-mapper-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'material-mapper-dialog';

    // Header
    const header = document.createElement('h3');
    header.innerHTML = '手动分配材质图片 <span>选中左侧图片，然后点击右侧对应槽位</span>';
    dialog.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'mapper-body';

    // === 左侧文件面板 ===
    const filesPanel = document.createElement('div');
    filesPanel.className = 'mapper-files-panel';
    const filesPanelTitle = document.createElement('h4');
    filesPanelTitle.textContent = `图片文件 (${imgFiles.length})`;
    filesPanel.appendChild(filesPanelTitle);

    const thumbEls: HTMLElement[] = [];

    fileUrls.forEach(({ file, url }, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'mapper-file-thumb';

      const img = document.createElement('img');
      img.src = url;

      const name = document.createElement('div');
      name.className = 'mapper-file-thumb-name';
      name.title = file.name;
      name.textContent = file.name;

      const badge = document.createElement('div');
      badge.className = 'mapper-file-thumb-badge';
      badge.style.display = 'none';

      thumb.appendChild(img);
      thumb.appendChild(name);
      thumb.appendChild(badge);
      thumbEls.push(thumb);

      thumb.onclick = () => {
        // 选中该文件
        thumbEls.forEach(t => t.classList.remove('selected'));
        thumb.classList.add('selected');
        selectedFileIdx = idx;
        // 高亮已分配的槽位
        refreshSlots();
      };

      filesPanel.appendChild(thumb);
    });

    // === 右侧槽位面板 ===
    const slotsPanel = document.createElement('div');
    slotsPanel.className = 'mapper-slots-panel';
    const slotsPanelTitle = document.createElement('h4');
    slotsPanelTitle.textContent = '颜色 × 格数 槽位';
    slotsPanel.appendChild(slotsPanelTitle);
    const hint = document.createElement('div');
    hint.className = 'mapper-slot-hint';
    hint.textContent = '先在左侧选一张图，再点击右侧空槽位完成分配。点击已分配槽位右上角 × 可清除。';
    slotsPanel.appendChild(hint);

    const grid = document.createElement('div');
    grid.className = 'mapper-grid';

    // 表头
    const emptyHeader = document.createElement('div');
    emptyHeader.className = 'mapper-grid-header';
    emptyHeader.textContent = '';
    grid.appendChild(emptyHeader);
    LENGTHS.forEach(len => {
      const h = document.createElement('div');
      h.className = 'mapper-grid-header';
      h.textContent = `${len} 格`;
      grid.appendChild(h);
    });

    const slotEls: Record<string, HTMLElement> = {};

    COLORS.forEach(({ key, label, dot }) => {
      const colorLabel = document.createElement('div');
      colorLabel.className = 'mapper-color-label';
      const dotEl = document.createElement('div');
      dotEl.className = 'mapper-color-dot';
      dotEl.style.background = dot;
      colorLabel.appendChild(dotEl);
      colorLabel.appendChild(document.createTextNode(label));
      grid.appendChild(colorLabel);

      LENGTHS.forEach(len => {
        const slotKey = `${key}-${len}`;
        const slot = document.createElement('div');
        slot.className = 'mapper-slot';

        const emptyText = document.createElement('div');
        emptyText.className = 'mapper-slot-empty-text';
        emptyText.textContent = '点击分配';
        slot.appendChild(emptyText);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'mapper-slot-clear';
        clearBtn.textContent = '×';
        clearBtn.onclick = (e) => {
          e.stopPropagation();
          const prevIdx = slotMap[slotKey];
          if (prevIdx !== undefined) {
            delete fileSlotMap[prevIdx];
            delete slotMap[slotKey];
            thumbEls[prevIdx].classList.remove('assigned');
            const badge = thumbEls[prevIdx].querySelector('.mapper-file-thumb-badge') as HTMLElement;
            if (badge) badge.style.display = 'none';
          }
          refreshSlots();
          refreshFooter();
        };
        slot.appendChild(clearBtn);

        slot.onclick = () => {
          if (selectedFileIdx === null) {
            hint.textContent = '⚠️ 请先在左侧选择一张图片！';
            return;
          }
          // 清除该文件之前占的槽
          const prevSlot = fileSlotMap[selectedFileIdx];
          if (prevSlot && prevSlot !== slotKey) {
            delete slotMap[prevSlot];
            if (slotEls[prevSlot]) refreshOneSlot(prevSlot);
          }
          // 清除该槽之前分配的文件
          const prevFileIdx = slotMap[slotKey];
          if (prevFileIdx !== undefined && prevFileIdx !== selectedFileIdx) {
            delete fileSlotMap[prevFileIdx];
            thumbEls[prevFileIdx].classList.remove('assigned');
            const b = thumbEls[prevFileIdx].querySelector('.mapper-file-thumb-badge') as HTMLElement;
            if (b) b.style.display = 'none';
          }
          // 分配
          slotMap[slotKey] = selectedFileIdx;
          fileSlotMap[selectedFileIdx] = slotKey;
          thumbEls[selectedFileIdx].classList.add('assigned');
          const badge = thumbEls[selectedFileIdx].querySelector('.mapper-file-thumb-badge') as HTMLElement;
          if (badge) { badge.textContent = `${label} ${len}格`; badge.style.display = ''; }
          refreshSlots();
          refreshFooter();
        };

        slotEls[slotKey] = slot;
        grid.appendChild(slot);
      });
    });

    slotsPanel.appendChild(grid);
    body.appendChild(filesPanel);
    body.appendChild(slotsPanel);
    dialog.appendChild(body);

    // === 底部 ===
    const footer = document.createElement('div');
    footer.className = 'mapper-footer';
    const progress = document.createElement('div');
    progress.className = 'mapper-progress';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'mapper-btn mapper-btn-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
      fileUrls.forEach(({ url }) => URL.revokeObjectURL(url));
      overlay.remove();
      resolve(null);
    };
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'mapper-btn mapper-btn-confirm';
    confirmBtn.textContent = '确认导入';
    confirmBtn.disabled = true;
    confirmBtn.onclick = async () => {
      const textures: Record<string, string> = {};
      for (const [slotKey, fileIdx] of Object.entries(slotMap)) {
        textures[slotKey] = await fileToBase64(fileUrls[fileIdx].file);
      }
      fileUrls.forEach(({ url }) => URL.revokeObjectURL(url));
      overlay.remove();
      resolve(textures);
    };
    footer.appendChild(progress);
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    dialog.appendChild(footer);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 初始化渲染
    refreshSlots();
    refreshFooter();

    function refreshOneSlot(slotKey: string) {
      const slot = slotEls[slotKey];
      if (!slot) return;
      const assignedIdx = slotMap[slotKey];
      slot.className = 'mapper-slot';
      // 清除旧内容（保留 clearBtn）
      const clearBtn = slot.querySelector('.mapper-slot-clear');
      slot.innerHTML = '';
      if (clearBtn) slot.appendChild(clearBtn);
      if (assignedIdx !== undefined) {
        slot.classList.add('ready');
        const img = document.createElement('img');
        img.src = fileUrls[assignedIdx].url;
        slot.appendChild(img);
      } else {
        if (selectedFileIdx !== null && !fileSlotMap[selectedFileIdx]) {
          slot.classList.add('targeted');
        }
        const emptyText = document.createElement('div');
        emptyText.className = 'mapper-slot-empty-text';
        emptyText.textContent = selectedFileIdx !== null ? '点击分配' : '—';
        slot.appendChild(emptyText);
      }
    }

    function refreshSlots() {
      Object.keys(slotEls).forEach(k => refreshOneSlot(k));
    }

    function refreshFooter() {
      const totalRequired = 20;
      const filled = Object.keys(slotMap).length;
      progress.innerHTML = `已分配 <b>${filled} / ${totalRequired}</b> 个槽位`;
      confirmBtn.disabled = filled < totalRequired;
    }
  });
}

"""

import re

with open('src/main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在 collectMaterialFiles 函数定义之前插入
INSERT_BEFORE = 'async function collectMaterialFiles('
idx = content.find(INSERT_BEFORE)
if idx == -1:
    raise ValueError('collectMaterialFiles not found')

content = content[:idx] + MAPPER_FUNC + content[idx:]

# 修改导入逻辑：识别失败时打开手动映射面板，同时宽松化完整性校验（允许不完整直接用）
OLD_IMPORT = '''            if (matchCount === 0) {

              alert('没有识别到材质图片。请选择正确的方块材质文件夹');

              return;

            }



            const requiredKeys = ['red', 'blue', 'green', 'yellow', 'pink']

              .flatMap(materialColor => [1, 2, 3, 4].map(length => `${materialColor}-${length}`));

            const missingKeys = requiredKeys.filter(key => !textures[key]);

            if (missingKeys.length > 0) {

              alert(`材质图片不完整，缺少 ${missingKeys.join(', ')}。`);

              return;

            }'''

NEW_IMPORT = '''            if (matchCount === 0) {

              // 自动识别失败，打开手动映射面板
              const manualTextures = await showMaterialMapperDialog(selectedFiles);
              if (!manualTextures) return; // 用户取消
              // 将手动映射结果合并
              Object.assign(textures, manualTextures);
              matchCount = Object.keys(textures).length;
              if (matchCount === 0) return;

            }



            const requiredKeys = ['red', 'blue', 'green', 'yellow', 'pink']

              .flatMap(materialColor => [1, 2, 3, 4].map(length => `${materialColor}-${length}`));

            const missingKeys = requiredKeys.filter(key => !textures[key]);

            if (missingKeys.length > 0) {

              const proceed = confirm(`材质图片不完整，缺少以下 ${missingKeys.length} 个槽位：\\n${missingKeys.join(', ')}\\n\\n缺少的颜色将使用默认材质显示。是否继续导入？`);

              if (!proceed) return;

            }'''

if OLD_IMPORT in content:
    content = content.replace(OLD_IMPORT, NEW_IMPORT, 1)
    print("Import logic patched successfully")
else:
    print("WARNING: could not find old import block, trying fallback...")
    # Try with \r\n line endings
    OLD_IMPORT_CRLF = OLD_IMPORT.replace('\n', '\r\n')
    NEW_IMPORT_CRLF = NEW_IMPORT.replace('\n', '\r\n')
    if OLD_IMPORT_CRLF in content:
        content = content.replace(OLD_IMPORT_CRLF, NEW_IMPORT_CRLF, 1)
        print("Import logic patched with CRLF")
    else:
        print("ERROR: pattern not found")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
