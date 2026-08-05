# This file uses the python3 package lyricsgenius

import lyricsgenius

genius = lyricsgenius.Genius("kv87PsmZusskx-DXiEzN-05K03T6LEyZ-8Q6DUweeXdIbjv7Epz-g-wfIz3ohDzl")
album = genius.search_album("play ep", 'ride')
album.save_lyrics()