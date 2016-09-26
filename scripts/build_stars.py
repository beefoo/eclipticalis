# -*- coding: utf-8 -*-

# Description: takes a .csv of star data and builds a json file for the UI
# Data source: https://github.com/astronexus/HYG-Database via http://www.astronexus.com/hyg
# Example usage:
#   python build_stars.py

import argparse
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
parser.add_argument('-c', dest="COUNT", default="10000", type=int, help="Number of most visible stars to retrieve")


# init input
args = parser.parse_args()

def norm(value, a, b):
    return (1.0*value - a) / (b - a)

stars = []
cols = [
    'x', 'y', 'z', # between -100,000 and 100,000
    'dec', # between -90 and 90°
    'ra', # between 0 and 24h (1h = 15°)
    'mag',
    'lum',
    'ci'
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
        if dec < args.MIN_DECLINATION or dec > args.MAX_DECLINATION or mag <= 0:
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

print "Found %s stars between %s° and %s° with positive magnitude" % (len(stars), args.MIN_DECLINATION, args.MAX_DECLINATION)
print "Stats:"
for col in stats:
    print "%s[%s, %s]" % (col, min(stats[col]), max(stats[col]))

print "Sorting data by magnitude..."
stars = sorted(stars, key=lambda k: k['mag'], reverse=True)
stars = stars[:args.COUNT]

print "Normalizing data..."
rows = []
for star in stars:
    x = round(star['x'],2)
    y = round(star['y'],2)
    z = round(star['z'],2)
    mag = round(norm(star['mag'], min(stats['mag']), max(stats['mag'])),2)
    lum = round(norm(star['lum'], min(stats['lum']), max(stats['lum'])),2)
    ci = round(norm(star['ci'], min(stats['ci']), max(stats['ci'])),2)
    rows.append([x, y, z, mag, lum, ci])

print "Writing %s stars to file %s" % (len(rows), args.OUTPUT_FILE)
with open(args.OUTPUT_FILE, 'w') as f:
    json.dump({
        'cols': ['x','y','z','mag','lum','ci'],
        'rows': rows
    }, f)
