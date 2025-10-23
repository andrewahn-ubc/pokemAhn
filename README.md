# My new personal website!!

Inspired by old-school Nintendo Pokemon games ^-^ Built using Phaser 3, React, and TypeScript.

## How to Play
Arrow keys: move player/navigate the map
Space bar: pause/resume music
m: switch song
+/-: zoom in/out

# If you're curious about how it works
### TLDR 
The website is a grid-based map, and I use a custom grid coordinate system (rather than using individual pixels) to make object placement easier. The player is also restricted to moving within these grid lines. 
### Code-free Layout Customization
Clone the repo and create your very own map!
<br> <br>
You can customize the map however you'd like by simply creating an 80 x 80 CSV file containing the layout you want and uploading it to /public (make sure its name is layout.csv). Think of it like designing a new Clash of Clans base! 
<br><br>
This is probably my favourite feature of this project, and it's cool because it kind of happened as a byproduct of trying to make it easier for myself to populate the map. Here's [an example of a spreadsheet](https://docs.google.com/spreadsheets/d/1CKZPGgkdf-Rzxx7nUUlGDda6GQvsGRF21Jx-axcMvm8/edit?usp=sharing) I used (I'm using Google Sheets to generate the CSV but you can use whatever you'd like (I highly recommend colouring your cells based on number for visual clarity)), along with the map it generated (there are missing road patches bc of a few bugs at this point):
<br> <br>
<img width="800" alt="image" src="https://github.com/user-attachments/assets/64bbd400-2786-47ca-b726-78281ca6ed66" />
<img width="800" alt="image" src="https://github.com/user-attachments/assets/8c88ab7f-94dc-4a2c-b64d-1329596811d4" />

<br>
Legend

1. Nothing  
2. Tree  
3. Path  
4. Bush  
5. White flower  
6. Red and white flower  
7. Red flower  
8. Nice bush  
9. Flowerbed  
10. Short tree  
11. Rocks  
12. House #1  
13. House #2  


<br>


# TODO
- refactor player and NPC logic into separate classes (so that I can reuse them in other scenes)
- implement other scenes (when the player "enters" a house, for example)
- confine NPCs to certain areas and make them collidable with the player
- implement dialogue with NPCs
- implement signs that display a popup

# Progress
Day 8 (collision detection and simple NPC):
<br>
![ScreenRecording2025-03-04at5 51 14AMonline-video-cutter com-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/e6ff77d3-fdb2-491b-940a-b97452f701d3)

Day 3:
<br>
![ScreenRecording2025-02-27at2 37 52PM-ezgif com-cut](https://github.com/user-attachments/assets/dec4d111-4e43-441e-b609-a9653a531585)

Day 1: 
<br>
![ScreenRecording2025-02-25at5 31 19PM-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/79112ada-1f6d-4cc7-9291-074c71cdfc18)


