Tested the import of the package for a fresh Unity version 2022.3.7f1.

The materials in the AvatarScene01 Unity package are made for Universal Render Pipeline. If you're using the standard pipeline instead, change the shaders of the materials in the ./Materials folder to 'Standard'. Alternatively you can make new materials with the textures from the ./Textures/Avatar folder.

There's a light source included in the prefab. If using the standard pipeline, the directional light intensity should be lowered to at least 0.75.

To get rid of the errors in the console about the rigbuilder & rigging, install a Unity package from the package manager: Unity registry -> Animation Rigging.