# -*- coding: utf-8 -*-

# Description: takes a .csv of star data and builds a json file for the UI
# Data source: https://github.com/astronexus/HYG-Database via http://www.astronexus.com/hyg
# Example usage:
#   python build_stars.py
#   python build_stars.py -of "../data/stars_guide.json"

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
parser.add_argument('-d0', dest="MIN_DECLINATION", default="-45", type=float, help="Minumum declination")
parser.add_argument('-d1', dest="MAX_DECLINATION", default="45", type=float, help="Maximum declination")
parser.add_argument('-c', dest="COUNT", default="5000", type=int, help="Max number of most visible stars to retrieve")
parser.add_argument('-sa', dest="SATURATION", default="0.5", type=float, help="Color saturation of stars")
parser.add_argument('-ml', dest="MIN_LUM", default="0.7", type=float, help="Minumum luminence of stars")
parser.add_argument('-m0', dest="MIN_MAGNITUDE", default="-1", type=float, help="Minumum visual magnitude of star")
parser.add_argument('-m1', dest="MAX_MAGNITUDE", default="6.5", type=float, help="Maximum visual magnitude of star")
parser.add_argument('-mc', dest="MAX_COORD", default="800.0", type=float, help="Maximum abs value of cartesian coordinate of star")
parser.add_argument('-fn', dest="FRUSTNUM_NEAR", default="10.0", type=float, help="Camera frustum near plane")
parser.add_argument('-s0', dest="MIN_SIZE", default="0.9", type=float, help="Minumum size of star")
parser.add_argument('-s1', dest="MAX_SIZE", default="27.0", type=float, help="Maximum size of star")

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

def ciToHue(ci):
    redHue = 1.0
    blueHue = 0.583
    yellowHue = 0.167
    if ci > 1.5:
        return redHue
    elif ci < 0.5:
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
    'ci', # color index
    'dist', # in parsecs
    'maxCoord'
]

# Read data
with open(args.INPUT_FILE) as f:
    reader = csv.DictReader(f)
    for row in reader:
        star = {}
        # check if valid declination
        dec = float(row['dec'])
        mag = float(row['mag'])
        ax = abs(float(row['x']))
        ay = abs(float(row['y']))
        az = abs(float(row['z']))
        coord = max([ax, ay, az])
        if dec < args.MIN_DECLINATION or dec > args.MAX_DECLINATION or mag < args.MIN_MAGNITUDE or mag > args.MAX_MAGNITUDE or coord > args.MAX_COORD:
            continue
        for col in cols:
            if col=='maxCoord':
                star[col] = coord
                continue
            val = 0
            try:
                val = float(row[col])
            except ValueError:
                val = 0
            star[col] = val
        stars.append(star)

# Sort and slice data
# print "Sorting data by visual magnitude..."
stars = sorted(stars, key=lambda k: k['mag'])
starLen = len(stars)
if starLen > args.COUNT:
    stars = stars[:args.COUNT]

# Get stats
stats = {}
for col in cols:
    stats[col] = []
for star in stars:
    for col in cols:
        stats[col].append(star[col])

# Print stats
print "Found %s stars between %s° and %s° with visual magnitude below %s" % (starLen, args.MIN_DECLINATION, args.MAX_DECLINATION, args.MAX_MAGNITUDE)
print "Stats:"
maxs = {}
mins = {}
for col in stats:
    _min = min(stats[col])
    _max = max(stats[col])
    _mean = mean(stats[col])
    mins[col] = _min
    maxs[col] = _max
    print "%s: min[%s] max[%s] mean[%s]" % (col, round(_min, 2), round(_max, 2), round(_mean, 2))

# Normalize data
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

    mag = round(norm(star['mag'], maxs['mag'], mins['mag']),2)
    lum = round(norm(star['lum'], mins['lum'], maxs['lum']),2)
    ci = round(norm(star['ci'], mins['ci'], maxs['ci']),2)
    dist = norm(star['dist'], mins['dist'], maxs['dist'])
    size = round(lerp(args.MIN_SIZE, args.MAX_SIZE, dist),2)
    l = max([args.MIN_LUM, lum])
    h = ciToHue(ci)
    (r, g, b) = colorsys.hls_to_rgb(h, l, s)
    # for showing north/south in color
    # if star['dec'] > 0:
    #     (r, g, b) = (0, 1, 0)
    #     size = 30
    # else:
    #     (r, g, b) = (1, 0, 0)
    #     size = 30
    # for showing east/west in color
    # if star['ra'] < 1 and star['ra'] > 0:
    #     (r, g, b) = (0, 1, 0)
    #     size = 30
    # elif star['ra'] < 4 and star['ra'] > 3:
    #     (r, g, b) = (1, 0, 0)
    #     size = 30
    r = round(r,2)
    g = round(g,2)
    b = round(b,2)
    rows.append([x, y, z, r, g, b, size, mag])
    sys.stdout.write('\r')
    sys.stdout.write(str(int(1.0*si/starCount*100))+'%')
    sys.stdout.flush()

# Output data
print "Writing %s stars to file %s" % (len(rows), args.OUTPUT_FILE)
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump({
        'cols': ['x','y','z','r','g','b','s','m'],
        'rows': rows
    }, f)
