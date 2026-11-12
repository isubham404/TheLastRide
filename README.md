THE LAST BEACON
Game Design Document (GDD)
Tagline: Two worlds. One friendship. One last chance.
Version: 1.0 | Date: 12 November 2026
Genre: 2D cinematic science-fiction platformer, puzzle adventure,
exploration
Platform: Windows PC | Engine: Godot 4 | Language:
GDScript
Visual style: Cinematic pixel art
1. Project Overview
The Last Beacon is a story-driven, 2D pixel-art science-fiction
adventure about a stranded human scientist and an alien engineer who
must learn to communicate, cooperate, and solve a crisis threatening
life across two worlds.

The story begins at Sambalpur University Institute of Information
Technology (SUIIT). An unusual biological discovery leads to a desperate
space mission. Ryland Grace travels aboard the Hail Mary spacecraft,
where he encounters Rocky, an intelligent alien engineer. Together, they
investigate a cosmic threat and attempt to save their home worlds.

The game combines platforming, exploration, scientific puzzles,
environmental storytelling, light survival mechanics, and
character-based cooperation.
IP note: This concept uses characters and story elements
associated with Project Hail Mary. It is an unofficial fan-game
concept. Obtain the necessary rights before public or commercial
distribution. Alternatively, replace protected characters, names,
settings, and plot elements with original creations.

2. Game Snapshot
  Item                                Description
  Title                               The Last Beacon

  Genre                               2D cinematic platformer, puzzle
adventure, exploration

  Perspective                         Side-scrolling

  Mode                                Single-player

  Art style                           Pixel art with cinematic lighting
and effects

  Platform                            Windows PC

  Engine                              Godot 4

  Scripting                           GDScript

  Output resolution                   1280 × 720

  Suggested logical resolution        320 × 180, scaled cleanly

  Estimated full-game length          3--5 hours (initial target)

  First playable demo                 20--30 minutes
Themes                              Friendship, sacrifice, scientific
curiosity, communication, hope
3. Design Pillars
1. Science as gameplay: Observe, test, compare, and reason instead
   of simply collecting keys.
2. Two characters, two skill sets: Ryland and Rocky approach
   problems differently.
3. Communication is a mechanic: Music, rhythm, signals, and
   experimentation help characters understand one another.
4. Cinematic pixel-art worlds: Lighting, parallax, particles, and
   sound create atmosphere.
5. Emotional choices: Cooperation and sacrifice drive the story.
4. Story and Setting
A mysterious biological phenomenon is connected to an unexplained change
in nearby stars. Scientists discover that it may threaten life on Earth.
Ryland Grace joins a mission aboard the Hail Mary spacecraft to
investigate the cause and find a solution.

Far from Earth, Grace encounters Rocky, an alien engineer whose world
faces the same danger. Their biology, technology, and communication
systems are different, but their goals align. They must combine their
knowledge before time runs out.
Main locations
- SUIIT campus: Opening location and first clues.
- Research laboratory: Biological discovery and molecular puzzles.
- Earth orbit: Launch sequence and transition into the mission.
- Hail Mary spacecraft: Repairs, resource management, exploration,
  and first contact.
- Deep space: Navigation, anomalies, and hazards.
- Alien ecosystem: Unfamiliar organisms and environmental puzzles.
- Erid: Rocky's world and the final stage of the story.
5. Main Characters
Ryland Grace
A human scientist and astronaut with a background in molecular biology.

Abilities - Scan and analyse objects. - Identify biological and
molecular properties. - Operate human interfaces and research
equipment. - Use a short-duration jetpack in selected sections. -
Interpret scientific data and solve laboratory puzzles.

Character direction: Curious, resourceful, occasionally uncertain,
and increasingly willing to risk himself for another life.
Rocky
An intelligent alien engineer with a rock-like body and a different
sensory and communication system.

Abilities - Climb selected surfaces and navigate narrow spaces. -
Move heavy objects. - Repair alien machinery. - Detect and interpret
sound-based signals. - Operate technology that Ryland cannot understand
alone.

Character direction: Practical, inventive, loyal, and expressive
through sound and action.
Character switching
The player controls one character at a time and switches using TAB.
Some puzzles require both characters' abilities in sequence. The game is
single-player; no second controller is required.
6. Core Gameplay
Proposed controls
  Input   Action
  A / D   Move left / right
Space   Jump
E       Interact
TAB     Switch character
Q       Scan / analyse
I       Open inventory
M       Open map
Shift   Sprint
Esc     Pause

Controls should be remappable before release.
Core gameplay loop
1. Explore an environment.
2. Notice an anomaly, obstacle, or clue.
3. Scan, listen, inspect, or collect evidence.
4. Form a hypothesis using the research journal.
5. Solve a puzzle or repair a system.
6. Unlock a new area or story moment.
7. Record discoveries and prepare for the next challenge.
Main systems
- Scientific scanner: Reveals clues, object properties, and
  biological information. It should provide observations rather than
  automatically solve every puzzle.
- Research journal: Stores discovered facts, samples, diagrams,
  and translated signals.
- Character-specific interactions: Some devices require human
  technology; others require Rocky's engineering skills.
- Light survival: Oxygen, energy, fuel, and repair materials may
  be limited in selected chapters. Resource pressure should create
  tension without becoming punishing.
- Save system: Autosave at chapter transitions and major
  milestones; store inventory, puzzle state, journal discoveries, and
  chapter progress.
7. Chapter Structure
Chapter 1 --- The Signal from Earth
Location: SUIIT campus and research laboratory

Story beats - Establish the campus at night. - Introduce Ryland and
the research environment. - Discover an unusual biological sample or
meteorite-related organism. - Investigate it using the scanner and
laboratory equipment. - Reveal a connection to a larger solar anomaly. -
Deliver an urgent message that leads to the space mission.

Gameplay: Basic movement and interaction tutorial, scanner tutorial,
sample-analysis puzzle, exploration, and dialogue.

Ending: The mission begins.
Chapter 2 --- The Hail Mary
Location: Launch sequence and spacecraft

Story beats - Show the launch and journey. - Ryland wakes aboard a
damaged spacecraft. - Establish the mission objective and system failure
risks. - Discover unfamiliar signals nearby.

Gameplay: Low-gravity movement, power and life-support repairs,
limited oxygen and energy, debris hazards, and investigation of an
unknown contact.

Ending: A mysterious visitor is detected.
Chapter 3 --- The Friend from Another World
Location: Hail Mary and nearby space

Story beats - Introduce Rocky. - Establish the difficulty of
communication. - Discover that musical tones and repeated patterns can
convey meaning. - Reveal that both characters face a shared problem.

Gameplay: Rhythm and sound-pattern puzzles, signal translator,
character switching, and cooperative engineering.

Ending: The characters agree to work together.
Chapter 4 --- The Planet of Secrets
Location: Alien environment and caves

Story beats - Explore an unfamiliar ecosystem. - Discover organisms
and environmental rules. - Collect samples and compare their
properties. - Identify a possible countermeasure to the cosmic threat.

Gameplay: Environmental hazards, sample analysis, Rocky-specific
climbing, Ryland-specific research, and a multi-stage biological puzzle.

Ending: The characters discover a promising solution, but it carries
a cost.
Chapter 5 --- The Cost of Friendship
Location: Spacecraft and dangerous deep-space area

Story beats - Contamination or system failure threatens the
mission. - Rocky is placed in danger. - Ryland must choose between the
safest route home and helping his friend. - The decision leads toward
the final mission.

Gameplay: Time-sensitive repairs, resource prioritisation, character
switching under pressure, and a rescue sequence.

Ending: Ryland chooses friendship and the chance to save another
world.
Chapter 6 --- The Last Beacon
Location: Erid

Story beats - Reach Rocky's world. - Complete the final
experiment. - Send the discovery or solution toward Earth. - Resolve the
characters' journey and show the new life Grace has found.

Gameplay: Combined puzzle types, final scientific experiment, signal
transmission, and exploration.

Ending: A beacon carries hope across the stars.
Epilogue
Earth receives a message containing a familiar musical greeting. The
final scene connects the two worlds and reinforces the friendship at the
centre of the game.
8. Puzzle Design
Puzzles should be understandable through observation and
experimentation, not arbitrary guessing.
- Molecular matching: Scan a sample, identify a relevant property,
  and adjust a laboratory instrument.
- Signal decoding: Listen to tones, identify repeated patterns,
  and reproduce them to communicate.
- Dual-character machinery: Rocky repairs or holds a mechanism
  while Ryland operates a human control panel.
- Environmental chemistry: Collect samples, compare reactions, and
  use the correct combination to neutralise an obstacle.
- Power routing: Trace a damaged circuit and redirect energy
  without overloading the system.
Puzzle principles: Introduce one new idea at a time; provide
optional journal hints; make feedback clear; let failed attempts teach
the player; and align difficulty with the story stakes.
9. World and Level Design
Each level should have a clear visual identity and readable path.

Level components - Safe exploration areas. - Platforming sections. -
Puzzle rooms. - Character-specific routes. - Optional collectibles. -
Story and dialogue triggers. - Checkpoints and transitions.

Pixel-art starting specifications - Ryland sprite: approximately 32
× 48 pixels. - Rocky sprite: approximately 40 × 40 pixels. - Tiles: 16 ×
16 or 32 × 32 pixels. - Use a consistent pixel grid and
nearest-neighbour texture filtering.

These are starting targets; adjust after testing readability and
animation quality.
10. Visual and Audio Direction
Visual style
- Detailed pixel-art characters and environments.
- Cinematic lighting and controlled glow effects.
- Parallax backgrounds for depth.
- Floating particles, dust, stars, and environmental effects.
- Smooth camera movement and deliberate framing during story moments.
- Distinct palettes for Earth, spacecraft, deep space, and alien
  environments.
Audio
- Original ambient music for each major location.
- Spacecraft hums, warning alarms, machinery, and environmental
  sounds.
- Distinct sound identities for Ryland and Rocky.
- Musical tones used as communication and as a puzzle language.
- Silence and restrained music during emotional scenes.
Use original or properly licensed audio. Check the terms of any
AI-generated music or voice service before distributing the game.
11. User Interface
Main menu: New Game, Continue, Chapters, Settings, Credits, Exit.

In-game HUD - Health or condition indicator, if used. - Oxygen or
energy indicator in relevant sections. - Current character indicator. -
Interaction prompt. - Scanner status. - Objective reminder.

Journal - Research notes. - Biological samples. - Signal patterns. -
Mission objectives. - Character memories and optional discoveries.

Keep the UI minimal and avoid covering important platforming or puzzle
information.
12. Collectibles and Optional Content
- Research logs.
- Alien recordings.
- Engineering blueprints.
- Biological samples.
- Spacecraft records.
- Friendship memories.
Optional discoveries should add context, character depth, or useful
information rather than merely inflate playtime.
13. Technical Plan
Recommended tools
  Area                 Tool
  Game engine          Godot 4
Programming          GDScript
Pixel art            Aseprite or Pixelorama
Concept references   ChatGPT image generation or PixelLab
Level planning       Godot TileMapLayer or Tiled
Audio editing        Audacity
Version control      Git and GitHub Desktop
Gameplay capture     OBS Studio
Trailer editing      DaVinci Resolve
Suggested project structure
'''bash
TheLastBeacon/
├── assets/
│   ├── characters/
│   │   ├── ryland/
│   │   └── rocky/
│   ├── environments/
│   │   ├── suiit/
│   │   ├── laboratory/
│   │   ├── spaceship/
│   │   ├── deep_space/
│   │   └── erid/
│   ├── backgrounds/
│   ├── animations/
│   ├── audio/
│   │   ├── music/
│   │   └── sfx/
│   ├── fonts/
│   └── ui/
├── scenes/
│   ├── main_menu/
│   ├── characters/
│   ├── chapters/
│   │   ├── chapter_01/
│   │   ├── chapter_02/
│   │   ├── chapter_03/
│   │   ├── chapter_04/
│   │   ├── chapter_05/
│   │   └── chapter_06/
│   └── puzzles/
├── scripts/
│   ├── player/
│   ├── character_switch/
│   ├── dialogue/
│   ├── inventory/
│   ├── puzzles/
│   └── save_system/
├── data/
└── project.godot
Core technical modules
1. Player movement and animation.
2. Camera and level boundaries.
3. Character switching.
4. Interaction and dialogue system.
5. Scanner and research journal.
6. Inventory and resource management.
7. Puzzle framework.
8. Checkpoints and save/load.
9. Audio and visual effects.
10. Windows export and settings.
14. Production Roadmap
This 16-week schedule targets a polished vertical slice, not the
complete 3--5 hour game.
  Phase                                        Weeks Deliverable
  Pre-production                                1--2 Story outline,
storyboard, art
references, project
setup

  Core movement                                 3--4 Ryland movement,
camera, collisions,
basic level

  First chapter                                 5--6 SUIIT environment,
lab, interactions,
scanner

  Puzzle systems                                7--8 Molecular puzzle,
journal, interaction
framework

  Rocky prototype                              9--10 Rocky movement,
character switching,
sound puzzle

  Spacecraft slice                            11--12 Small spacecraft
level, repairs,
lighting and audio

  Story polish                                13--14 Dialogue, cinematic
transitions, UI,
sound design
Testing and build                           15--16 Bug fixing,
playtesting,
optimisation, Windows
demo
A complete game will require additional production time after the
vertical slice. Adjust scope to the size and availability of the team.
15. First 7 Days
Day 1 --- Setup - Install Godot 4. - Create the project and
initialise Git. - Set target resolution and input actions.

Day 2 --- Ryland - Create or import a consistent character
reference. - Build idle, walk, and jump animations. - Import the sprite
sheet into Godot.

Day 3 --- Rocky - Create a character reference and basic sprite. -
Plan movement and interaction differences.

Day 4 --- Movement prototype - Implement movement, jumping,
collision, and camera follow. - Test on a simple platforming level.

Day 5 --- SUIIT environment - Build a small campus scene with a
clear route. - Add background layers and basic lighting.

Day 6 --- Interaction - Add an interactable computer or laboratory
object. - Implement a scanner prompt and dialogue box.

Day 7 --- Playtest - Test the complete short sequence. - Fix
movement and collision issues. - Save a stable version and record the
next tasks.
16. Team Roles
For a small team, one person may take multiple roles.
- Game director / writer: Story, tone, scope, and creative
  decisions.
- Programmer: Godot systems, gameplay, tools, and builds.
- Pixel artist / animator: Characters, environments, effects, and
  animation.
- Level designer: Platform layouts, puzzle flow, and pacing.
- UI/UX designer: Menus, HUD, journal, and accessibility.
- Audio designer: Music, ambience, effects, and signal language.
- QA tester: Playtesting, bug reports, and regression checks.
17. First Demo Scope
Target length: 20--30 minutes.

Included content 1. SUIIT campus introduction. 2. Laboratory
discovery and scanner tutorial. 3. One molecular or sample-analysis
puzzle. 4. Short mission and launch cinematic. 5. First playable section
aboard the Hail Mary. 6. A damaged-system repair puzzle. 7. First
contact with Rocky and a short signal interaction.

Demo success criteria - The player understands the basic story. -
Movement and interaction feel reliable. - The scanner puzzle is
understandable. - The visual style is consistent. - The first Rocky
encounter creates curiosity. - The demo runs smoothly on the target
Windows hardware.
18. Risks and Mitigations
  Risk                                Mitigation
  Scope becomes too large             Finish a short vertical slice
before expanding

  Inconsistent pixel art              Use fixed sprite references,
palettes, and grid rules

  Difficult puzzle logic              Prototype puzzles separately and
playtest early

  Performance issues                  Prefer 2D effects, optimise
textures, and profile regularly

  Unclear character switching         Teach each ability in a safe,
dedicated tutorial

  Audio licensing problems            Use original or properly licensed
assets
Intellectual-property restrictions  Obtain permissions or create an
original story and characters
19. Definition of Done
The vertical slice is ready when: - The demo can be completed from start
to finish. - The player can move, jump, interact, and use the scanner. -
At least one complete puzzle works. - Character switching works reliably
in the Rocky prototype. - Dialogue and cinematic transitions play
correctly. - The game saves and loads at intended checkpoints. - There
are no known game-blocking bugs. - The Windows build has been tested in
a fresh run.
20. Project Principles
- Build one tested feature at a time.
- Keep backups and use version control.
- Use AI tools to accelerate drafts and references, but review every
  asset and line of code.
- Do not try to generate the entire game in one prompt.
- Prototype mechanics before building large levels.
- Keep the first demo achievable.
- Prioritise a memorable story and responsive gameplay over sheer
  content volume.
Closing Statement
The Last Beacon is a story about two beings from different worlds
who discover that understanding one another may be the most important
technology of all.

Two worlds. One friendship. One last chance.
