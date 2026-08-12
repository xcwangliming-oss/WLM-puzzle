from PIL import Image
try:
    img = Image.open('public/assets/gem-shatter/粉/Armature_1_1_00.png')
    print("Dimensions:", img.size)
except Exception as e:
    print(e)
