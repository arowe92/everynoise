import sys
import pymongo
import bson
import json
import os

import soundfile as sf
import numpy as np

from pymongo import MongoClient
from multiprocessing import Pool
from scipy import signal

database_url = "192.168.0.22:2717"
client = MongoClient(database_url, connect=False)
db = client.everynoise
samples = db.samples

def main():
  p = Pool(8)
  sys.argv[1:]
  results = p.map(calcSpectrogram, sys.argv[1:])

  print(len(results))

def calcSpectrogram(id):

  sample = samples.find_one({'_id': bson.ObjectId(id)})

  with open('/tmp/' + id + '.wav', 'wb') as f:
    f.write(sample['wavData'])

  data, samplerate = sf.read('/tmp/' + id + '.wav')

  # Add channels together
  data = np.transpose(data)

  if len(data) == 2:
    data = data[0] + data[1]

  frequencies, times, spec_data = signal.spectrogram(data, fs=samplerate, mode='magnitude', scaling='spectrum')

  spec_dict = {
    'frequencies': frequencies.tolist(),
    'times': times.tolist(),
    'data': spec_data.tolist()
  }

  sample = samples.find_one({'_id': bson.ObjectId(id)})

  # Update on database
  return samples.find_one_and_update({
    '_id': sample['_id']
  }, {'$set':{'spectrogram': spec_dict}})


if __name__ == '__main__':
  main()
