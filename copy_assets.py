import shutil
import os

src = r"F:\桌面\puzle物料\破碎效果\5色"
dst = r"public\assets\gem-shatter-new"

if os.path.exists(dst):
    shutil.rmtree(dst)
shutil.copytree(src, dst)
print("Copied successfully.")
