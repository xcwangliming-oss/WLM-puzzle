#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

with open('src/main.ts', encoding='utf-8') as f:
    lines = f.readlines()

# Line 15897: armRecordingForPlayback
lines[15897-1] = lines[15897-1].replace("setRecordButtonContent('⏺', '录制', '视频');", "setRecordButtonContent('⏹', '取消', '武装');")

# Line 36993: progress tracking
lines[36993-1] = lines[36993-1].replace("setRecordButtonContent('⏺', '录制', '视频');", "setRecordButtonContent('⏳', '转码中', progress + '%');")

# Line 38201: startRecording phase 1
lines[38201-1] = lines[38201-1].replace("setRecordButtonContent('⏺', '录制', '视频');", "setRecordButtonContent('⏳', '准备中', '...');")

# Line 38409: startRecording phase 2
lines[38409-1] = lines[38409-1].replace("setRecordButtonContent('⏺', '录制', '视频');", "setRecordButtonContent('⏹', '停止', '录制');")

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Patch applied successfully.")
