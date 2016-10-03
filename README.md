# Music Eclipticalis

The interface uses [Three.js](http://threejs.org/) to interact with the 3D stellar data and [Howler.js](http://howlerjs.com/) to play the music.

## Requirements

1. [Python 2.7+](https://www.python.org/downloads/)
2. [Node.js](https://nodejs.org/en/)
  * [Gulp](http://gulpjs.com/)

## Instructions for use

To build star data for use in the interface:

1. Download a .csv file (e.g. hygdata_v3.csv) from [HYG star database](https://github.com/astronexus/HYG-Database)
2. Run `python build_stars.py`. Run `python build_stars.py -h` for more details about optional parameters.

To run and develop locally

1. Run `npm install`
2. Run `gulp`
