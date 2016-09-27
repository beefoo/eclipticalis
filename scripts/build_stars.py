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
parser.add_argument('-mm', dest="MAX_MAGNITUDE", default="6.5", type=float, help="Maximum visual magnitude of star")

# init input
args = parser.parse_args()

def lerp(a, b, percent):
    return (1.0*b - a) * percent + a

def norm(value, a, b):
    return (1.0*value - a) / (b - a)

def normSigned(value, a, b):
    n = norm(value, a, b)
    return n * 2.0 - 1;

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
        if dec < args.MIN_DECLINATION or dec > args.MAX_DECLINATION or mag > args.MAX_MAGNITUDE:
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
    print "%s[%s, %s]" % (col, min(stats[col]), max(stats[col]))

print "Sorting data by visual magnitude..."
stars = sorted(stars, key=lambda k: k['mag'])
if len(stars) > args.COUNT:
    stars = stars[:args.COUNT]

print "Normalizing data..."
rows = []
s = args.SATURATION
starCount = len(stars)
for si, star in enumerate(stars):
    x = round(star['x'], 2)
    y = round(star['y'], 2)
    z = round(star['z'], 2)
    mag = round(norm(star['mag'], max(stats['mag']), min(stats['mag'])),2)
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
    rows.append([x, y, z, mag, r, g, b])
    sys.stdout.write('\r')
    sys.stdout.write(str(int(1.0*si/starCount*100))+'%')
    sys.stdout.flush()

print "Writing %s stars to file %s" % (len(rows), args.OUTPUT_FILE)
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump({
        'cols': ['x','y','z','m','r','g','b'],
        'rows': rows
    }, f)
