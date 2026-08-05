# this was written by chatGPT

import csv
import json
import glob
import re
import html

# Function to clean up lyrics
def clean_lyrics(text):
    # Decode any unicode escape sequences
    if text:
        text = bytes(text, 'utf-8').decode('unicode_escape')
        
        # Replace the unwanted HTML entities like &nbsp; (non-breaking spaces) and others
        text = html.unescape(text)
        
        # Optionally clean up any stray characters or patterns
        text = re.sub(r'\[.*?\]', '', text)  # Remove any lyrics part like [Verse 1], etc.
        text = re.sub(r'[\n\t\r]', ' ', text)  # Remove newlines, tabs, carriage returns
        text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with one space
        text = text.strip()  # Remove any leading or trailing whitespace
    
    return text

# Get a list of all JSON files in the current directory
json_files = glob.glob('*.json')  # Use the directory path if the files are not in the current directory

# Open the CSV file for writing
with open('lyrics_data.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    
    # Write the header row (only once)
    writer.writerow(["Track Number", "Song Title", "Artist", "Release Date", "Lyrics", "Album Name"])
    
    # Loop through each JSON file
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            # Load the JSON data
            data = json.load(f)

        # Extract the album name from the JSON file (assuming it's under the "name" key)
        album_name = data.get("name", "Unknown Album")  # Default to "Unknown Album" if not found
        
        # Iterate over the tracks in the current JSON file
        for track in data.get("tracks", []):  # Use .get to avoid KeyError if "tracks" is missing
            song = track["song"]
            track_number = track["number"]
            song_title = song["title"]
            artist = song["artist_names"]
            release_date = song["release_date_for_display"]
            lyrics = song.get("lyrics", "")  # Ensure lyrics are fetched correctly

            # Clean lyrics text
            lyrics = clean_lyrics(lyrics)

            # debugging
            print(f"File: {json_file}, Lyrics extracted: {lyrics[:100]}")

            # Write the extracted data as a new row in the CSV file
            writer.writerow([track_number, song_title, artist, release_date, lyrics, album_name])

print("Data from all JSON files written to lyrics_data.csv")