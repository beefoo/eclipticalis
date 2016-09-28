# -*- coding: utf-8 -*-

# Description: takes a .csv of star data and builds a json file for the UI
# Data source: https://github.com/astronexus/HYG-Database via http://www.astronexus.com/hyg
# Example usage:
#   python build_stars.py

import argparse
import colorsys
import csv
import json
import os
import sys

# input
parser = argparse.ArgumentParser()
parser.add_argument('-if', dest="INPUT_FILE", default="../data/hygdata_v3.csv", help="Path to input csv star database via http://www.astronexus.com/hyg")
parser.add_argument('-of', dest="OUTPUT_FILE", default="../data/stars.json", help="Path to output stars json file")
parser.add_argument('-d0', dest="MIN_DECLINATION", default="-30", type=float, help="Minumum declination")
parser.add_argument('-d1', dest="MAX_DECLINATION", default="30", type=float, help="Maximum declination")
parser.add_argument('-c', dest="COUNT", default="10000", type=int, help="Max number of most visible stars to retrieve")
parser.add_argument('-sa', dest="SATURATION", default="0.2", type=float, help="Color saturation of stars")
parser.add_argument('-ml', dest="MIN_LUM", default="0.7", type=float, help="Minumum luminence of stars")
parser.add_argument('-m0', dest="MIN_MAGNITUDE", default="-1", type=float, help="Maximum visual magnitude of star")
parser.add_argument('-m1', dest="MAX_MAGNITUDE", default="6.5", type=float, help="Maximum visual magnitude of star")
parser.add_argument('-mc', dest="MAX_COORD", default="800.0", type=float, help="Maximum abs value of cartesian coordinate of star")
parser.add_argument('-fn', dest="FRUSTNUM_NEAR", default="10.0", type=float, help="Camera frustum near plane")

# init input
args = parser.parse_args()

def lerp(a, b, percent):
    if percent >= 0:
        return (1.0*b - a) * percent + a
    else:
        percent = abs(percent)
        return -1.0 * ((1.0*b - a) * percent + a)

def mean(arr):
    return float(sum(arr)) / max(len(arr), 1)

def norm(value, a, b):
    return (1.0*value - a) / (b - a)

def normSigned(value, a, b):
    n = norm(value, a, b)
    return n * 2.0 - 1;

def getSize(x, y, z):
    m = mean([abs(x), abs(y), abs(z)])
    size = 2
    if m < 10:
        size = 1
    if m > 20:
        size = 3
    if m > 40:
        size = 4
    if m > 50:
        size = 5
    if m > 100:
        size = size + int(m/100)
    return size

def ciToHue(ci):
    redHue = 1.0
    blueHue = 0.583
    yellowHue = 0.167
    if ci > 2:
        return redHue
    elif ci < 1:
        return blueHue
    else:
        return yellowHue

stars = []
cols = [
    'x', 'y', 'z', # between -100,000 and 100,000
    'dec', # between -90 and 90°
    'ra', # between 0 and 24h (1h = 15°)
    'mag', # between -27 and 21; inverse relationship; -27 is the sun; 6.5 and below are visible to typical human eye
    'lum',
    'ci' # color index
]

stats = {}
for col in cols:
    stats[col] = []

with open(args.INPUT_FILE) as f:
    reader = csv.DictReader(f)
    for row in reader:
        star = {}
        # check if valid declination
        dec = float(row['dec'])
        mag = float(row['mag'])
        x = abs(float(row['x']))
        y = abs(float(row['y']))
        z = abs(float(row['z']))
        coord = max([x, y, z])
        if dec < args.MIN_DECLINATION or dec > args.MAX_DECLINATION or mag < args.MIN_MAGNITUDE or mag > args.MAX_MAGNITUDE or coord > args.MAX_COORD:
            continue
        for col in cols:
            val = 0
            try:
                val = float(row[col])
            except ValueError:
                # not a float
                val = 0
            star[col] = val
            stats[col].append(val)
        stars.append(star)

print "Found %s stars between %s° and %s° with visual magnitude below %s" % (len(stars), args.MIN_DECLINATION, args.MAX_DECLINATION, args.MAX_MAGNITUDE)
print "Stats:"
for col in stats:
    print "%s[%s, %s] mean[%s]" % (col, min(stats[col]), max(stats[col]), mean(stats[col]))

print "Sorting data by visual magnitude..."
stars = sorted(stars, key=lambda k: k['mag'])
if len(stars) > args.COUNT:
    stars = stars[:args.COUNT]

print "Normalizing data..."
rows = []
s = args.SATURATION
starCount = len(stars)
for si, star in enumerate(stars):
    # px = normSigned(star['x'], min(stats['x']), max(stats['x']))
    # py = normSigned(star['y'], min(stats['y']), max(stats['y']))
    # pz = normSigned(star['z'], min(stats['z']), max(stats['z']))
    # x = round(lerp(args.FRUSTNUM_NEAR, args.FRUSTNUM_FAR, px), 2)
    # y = round(lerp(args.FRUSTNUM_NEAR, args.FRUSTNUM_FAR, py), 2)
    # z = round(lerp(args.FRUSTNUM_NEAR, args.FRUSTNUM_FAR, pz), 2)
    x = round(star['x'], 2)
    y = round(star['y'], 2)
    z = round(star['z'], 2)
    size = getSize(x, y, z)
    # mag = round(norm(star['mag'], max(stats['mag']), min(stats['mag'])),2)
    lum = round(norm(star['lum'], min(stats['lum']), max(stats['lum'])),2)
    ci = round(norm(star['ci'], min(stats['ci']), max(stats['ci'])),2)
    l = max([args.MIN_LUM, lum])
    h = ciToHue(ci)
    (r, g, b) = colorsys.hls_to_rgb(h, l, s)
    # for showing north/south in color
    # if star['dec'] > 0:
    #     (r, g, b) = (0, 1, 0)
    # else:
    #     (r, g, b) = (1, 0, 0)
    r = round(r,2)
    g = round(g,2)
    b = round(b,2)
    rows.append([x, y, z, r, g, b, size])
    sys.stdout.write('\r')
    sys.stdout.write(str(int(1.0*si/starCount*100))+'%')
    sys.stdout.flush()

print "Writing %s stars to file %s" % (len(rows), args.OUTPUT_FILE)
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump({
        'cols': ['x','y','z','r','g','b','s'],
        'rows': rows
    }, f)
