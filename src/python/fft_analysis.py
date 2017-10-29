# %matplotlib inline
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
import scipy.fftpack
import sys
from pprint import pprint

from multiprocessing import Pool

import pymongo
import bson
from pymongo import MongoClient
import soundfile as sf

client = MongoClient('mongodb://hampton:32717/', connect=False)
db = client.everynoise
samples = db.samples

def fft(id):
  print("Starting", id)
  sample = samples.find_one({"_id": bson.ObjectId(id)})

  with open('/tmp/' + id + '.wav', 'wb') as f:
    f.write(sample['wavData'])

  data, samplerate = sf.read('/tmp/' + id + '.wav')

  # Add channels together
  data = np.transpose(data)

  if len(data) == 2:
    data = data[0] + data[1]

  offset = 0
  N = 1024

  T = 1.0 / samplerate

  data2D = []

  while offset + N/2 < len(data):
    yf = scipy.fftpack.fft(data[offset:offset + N])
    data2D.append(yf[0:int(N/2)])
    offset += int(N/16)

  data2D = np.absolute(data2D)

  re = samples.find_one_and_update({"_id": sample['_id']}, {"$set":{'fftData': data2D.tolist()}})
  print("Updated", re['_id'])

# xf = np.linspace(0.0, 1.0/(2.0 * T), N/2)

# fig, ax = plt.subplots()
# ax.plot(xf, np.absolute(data2D[1][0:int(N/2)]))
# plt.show()

# plt.imshow(np.transpose(data2D), cmap=matplotlib.cm.binary, interpolation="nearest");
# plt.axis("off")
# plt.show()

p = Pool(8)
print(sys.argv[1:])
p.map(fft, sys.argv[1:])
print("Done")
