from PIL import Image

try:
    img = Image.open(r"F:\桌面\puzle物料\破碎效果\5色\红色\红色_00020.png")
    print("Dimensions:", img.size)
    bbox = img.getbbox()
    print("Bounding box (left, upper, right, lower):", bbox)
    print("Center of image:", img.size[0]/2, img.size[1]/2)
    
    if bbox:
        bbox_center_x = (bbox[0] + bbox[2]) / 2
        bbox_center_y = (bbox[1] + bbox[3]) / 2
        print("Center of visible pixels:", bbox_center_x, bbox_center_y)
        
        offset_y = img.size[1]/2 - bbox_center_y
        print("Y Offset (positive means visible pixels are HIGHER than image center):", offset_y)
except Exception as e:
    print("Error:", e)
