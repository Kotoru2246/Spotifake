"""Run from the project root: python -m unittest BackendAI.test_spotdl_runner"""
import unittest
from types import SimpleNamespace

from BackendAI.spotdl_runner import ordered_releases, unique_recordings


def song(name, duration, artist="A", album="X"):
    return SimpleNamespace(name=name, duration=duration, artist=artist, album_name=album)


def release(release_id, kind):
    return {"releases": {"items": [{"id": release_id, "type": kind}]}}


class SpotdlRunnerTest(unittest.TestCase):
    def test_albums_come_first_and_repeated_ids_once(self):
        pages = [[release("s1", "SINGLE"), release("c1", "COMPILATION")],
                 [release("a1", "ALBUM"), release("s1", "SINGLE")]]
        self.assertEqual([r["id"] for r in ordered_releases(pages)], ["a1", "s1", "c1"])

    def test_same_recording_is_kept_once_from_the_first_release(self):
        songs = [song("Idol", 213, album="Album"), song("IDOL", 214, album="Single")]
        self.assertEqual([s.album_name for s in unique_recordings(songs)], ["Album"])

    def test_other_versions_stay(self):
        songs = [song("Idol", 213), song("Idol", 250), song("Idol - Live", 213), song("Idol", 213, artist="B")]
        self.assertEqual(len(unique_recordings(songs)), 4)


if __name__ == "__main__":
    unittest.main()
