"""Step 1: list artists by song count; write library_labels.csv from artist_genre_map.csv."""
import sqlite3, csv, re, os, sys
sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
def first_artist(name):
    return re.split(r'/|, ', name or '')[0].strip()
def load():
    c = sqlite3.connect('file:' + os.path.join(REPO, 'backendai.db').replace(chr(92), '/') + '?mode=ro', uri=True)
    rows = c.execute("select SongID,Title,ArtistName,FilePath from Songs where IsDeleted=0").fetchall()
    return [(r[0], r[1], first_artist(r[2]), r[3]) for r in rows]
if __name__ == '__main__':
    rows = load()
    from collections import Counter
    cnt = Counter(r[2] for r in rows)
    if '--list' in sys.argv:
        for a, n in cnt.most_common(): print(n, a)
        sys.exit()
    amap = {}
    for r in csv.DictReader(open(os.path.join(HERE, 'artist_genre_map.csv'), encoding='utf-8')):
        amap[r['artist']] = r
    out = csv.writer(open(os.path.join(HERE, 'library_labels.csv'), 'w', newline='', encoding='utf-8'))
    out.writerow(['song_id', 'artist', 'labels10', 'labels11', 'source'])
    n = 0
    for sid, t, a, fp in rows:
        m = amap.get(a)
        if not m: continue
        out.writerow([sid, a, m['acceptable_labels_10'], m['acceptable_labels_11'], 'artist-map (unreviewed)']); n += 1
    print('songs written', n, 'of', len(rows))
