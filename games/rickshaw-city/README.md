# Rickshaw City — FEXO HUB (Dhaka Style, High Performance)

A browser-based 3D open-world rickshaw driving game set in a crowded Dhaka-style city, built with Three.js r160.

## Content

- **350 vehicles**: 150 car, 50 SUV, 15 monster, 30 truck, 20 bus, 85 bike
- **699 pedestrians**: 40% walk on roads for crowded Dhaka feel
- **250 footpath stalls**: Cha er Dokan, Muri, Chotpoti, Jhalmuri, Fuchka, Mobile Recharge
- Buildings: Supermall, Supershop, Kacchi Bhai, Star Kabab, Haji Biriyani, Hotel Al-Razzaq, New Market, Aarong — with sign boards

## Performance (60-120 FPS target)

- Adaptive pixel ratio: FPS drops below 50 → pixel ratio lowers; above 100 → raises (max 1.5)
- FPS counter in HUD
- Chunk-based building culling (only nearby chunks render)
- InstancedMesh for zebra crossings and street lights
- Shared materials, window texture instead of separate window meshes
- Antialiasing off, `powerPreference: 'high-performance'`
- Fog at 1500 to cull distant objects

## Device Support

- **Phone**: on-screen touch buttons (SPEED, BRAKE, REVERSE, BOOST, LEFT, RIGHT) + touch drag camera
- **Laptop/PC**: keyboard (WASD/arrows, Shift, E, C) + mouse drag camera
- **Xbox 360 controller**: Left stick = steer, RT = accelerate, LT = brake/reverse, A = boost, Y = toggle camera
- **TV remote**: D-pad/arrow keys work as steering; OK/Enter opens shop

## Day / Night Cycle

- 2 minutes day, 2 minutes night
- Sun rises/sets smoothly; moon at night
- Street lights on at night, off in morning
- Traffic lights control all vehicles

## More Realistic Models

- Rickshaw: canopy frame, seat, driver, chrome wheels, detailed body
- Vehicles: cabin, windshield, lights, wheels with rims
- Buildings: sign board, roof, grass base
