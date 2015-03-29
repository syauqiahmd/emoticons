import os
import json
import sys
import re
import struct
from xml.etree import ElementTree
from os import path

# Required fields in the manifest
required_fields = ['name', 'emoticons']
# Pattern to match emoticon files
file_re = r'^[a-zA-Z0-9_-]*$'
# Maximum width/height of emotions
max_wh = 64
# Maximum emoticon file size
max_file_size = 1024 * 50


# Read the manifest. This'll throw an exception and exit if invalid.
def get_manifest_data(subdir):
    # Only load directories that bear a manifest
    manifest = path.join(subdir, 'index.json')
    if not path.exists(manifest):
        return None

    print('Verifying `%s`...' % subdir)

    with open(manifest) as file:
        try:
            data = json.load(file)
            print('\tJSON is valid.')
        except ValueError:
            raise AssertionError('\tERR: Could not read manifest, invalid JSON.')

    return data


# Check for missing fields in the manifest, erroring if any are missing.
def check_manifest_fields(data):
    for field in required_fields: assert field in data
    print('\tRequired fields are present.')


# Checks that the emoticon file at `src` exists with some valid extension,
# and that the file format is correct.
def check_emoticon_file(fp):
    print('\t\tVerifying `%s`' % fp)

    if path.exists(path.join(fp + '.svg')):
        src = path.join(fp + '.svg')
        width, height = get_svg_dimensions(src)
    elif path.exists(path.join(fp + '.png')):
        src = path.join(fp + '.png')
        width, height = get_png_dimensions(src)
    else:
        raise AssertionError('\tERR: emoticon `%s` not found.' % fp)

    assert width <= max_wh, height <= max_wh
    assert os.path.getsize(src) < max_file_size

# Gets dimentions of a png image. From:
# http://coreygoldberg.blogspot.com/2013/01/python-verify-png-file-and-get-image.html
def get_png_dimensions(path):
    with open(path, 'rb') as f:
        data = f.read()
        w, h = struct.unpack('>LL', data[16:24])
        return int(w), int(h)

# Gets the viewbox dimentions from an svg file.
def get_svg_dimensions(path):
    root = ElementTree.parse(path).getroot()
    dimens = root.attrib['viewBox'].split(' ')

    return int(dimens[2]), int(dimens[3])

# Checks the list item of the emoticon only - makes sure it does not
# contain banned characters and that the code is long enough.
def check_emoticon_list(emoticon, file):
    assert re.match(file_re, file)
    assert len(emoticon) > 1


for subdir in os.listdir('.'):
    data = get_manifest_data(subdir)
    if data is None:
        continue

    check_manifest_fields(data)

    # Check that emoticons don't contained any banned chars, and that
    # the codes are sufficiently long.
    count = 0
    print('\tVerifying emoticons.')
    for emoticon, file in data['emoticons'].items():
        check_emoticon_list(emoticon, file)
        check_emoticon_file(path.join(subdir, file))
        count += 1

    print('\tSuccessfully verified %s emoticons.' % count)


