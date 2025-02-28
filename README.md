# My new personal website!!

Inspired by old-school Nintendo Pokemon games ^-^ Built using Phaser 3, React, and TypeScript.

# if you're curious
### TLDR of how it works
The map is grid-based, and throughout the entire codebase, I use a custom coordinate system to ([0,0] to [80,80]) to make object placement eaiser. The player is also restricted to moving within these grid lines. 
### Code-free Layout Customization
You can customize the map however you'd like by simply creating an 80 x 80 CSV file containing the layout you want and upload it to /public. Think of it like designing a new Clash of Clans base! This is probably my favourite feature of this project, and it's cool because it kind of happened as a byproduct of trying to make it easier for myself to populate the map. Here's an example of a spreadsheet I used (I'm using Google Sheets to generate the CSV but you can use whatever you'd like (I highly recommend colouring your cells based on number for visual clarity)):
<br>
<img width="1454" alt="image" src="https://github.com/user-attachments/assets/64bbd400-2786-47ca-b726-78281ca6ed66" />
Legend:
- 0: nothing
- 1: tree
- 2: path (don't worry, I'm gonna add more stuff)

<br>


# TODO
- take care of more edge cases for path generation (the one where 3 sides and 1 corner are path, and the end of single-width paths)
- implement NPCs (just walking around is fine for now, dialogue can come later)
- populate the scene with houses, bushes, rocks, flowers, and signs
- create elements that can generate popups
- if the player stops moving while facing a non-down direction, leave them standing in that direction
- other scenes (when the player "enters" a house, for example)
- some actual gameplay?

# Progress
Day 3:
<br>
![ScreenRecording2025-02-27at2 37 52PM-ezgif com-cut](https://github.com/user-attachments/assets/dec4d111-4e43-441e-b609-a9653a531585)

Day 1: 
<br>
![ScreenRecording2025-02-25at5 31 19PM-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/79112ada-1f6d-4cc7-9291-074c71cdfc18)


