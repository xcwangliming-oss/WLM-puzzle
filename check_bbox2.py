from PIL import Image

try:
    img = Image.open(r"F:\桌面\puzle物料\破碎效果\5色\红色\红色_00001.png")
    bbox = img.getbbox()
    print("Frame 1 bbox:", bbox)
    if bbox:
        bbox_center_y = (bbox[1] + bbox[3]) / 2
        print("Frame 1 visible Y center:", bbox_center_y)
        print("Distance from image center (269):", 269 - bbox_center_y)
except Exception as e:
    print(e)
