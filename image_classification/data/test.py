import numpy as np
from PIL import Image
mask = np.array(Image.open("./semantic_mask.png"))
print(np.unique(mask))