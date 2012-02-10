COB Sequence Section Destroyer v2.0.0
=====================================

The point of COB_SSD (Sequence Section Destroyer) is to aid in the
deletion of portions (or all) of a selected image sequence directly from within
After Effects.

Author: Collin D Brooks <collin.brooks@gmail.com>

Why would I use it?
===================

We all know that, even though it takes an extra step to render an image
sequence before rendering to a movie file, rendering to an image sequence is
much safer. If an image sequence render blows up, all is not lost! Once you
figure out what caused the render error, all you have to do is restart your
render and rendering will begin from where it left off.

Rendering to an image sequence does have its drawbacks though. If you modify
something within your project, you must delete the previously rendered frames
so they will be re-rendered instead of being skipped over in a multi-machine
render setup. Deleting files through Finder or Windows Explorer can become
tedious; especially if there are tens of thousands of frames within a sequence.
The last thing you want to hear from Finder or Windows Explorer is that it is
"preparing to delete" files!

That's where COB SSD comes in.

The COB SSD script simplifies the deletion process by allowing you to select a
sequence to operate on and then, after providing beginning and end frame
numbers for the frames you want to delete, nuking those suckers into oblivion
without leaving After Effects!

It doesn't stop there though! The following tools help with the deletion
process:

 * Get Work Area - This tool takes the in and out points of the work area for
   the selected composition and sets the beginning and end frame numbers for
   you! This makes it easy to visualize exactly what portion of your
   composition you want deleted.
 * Get RQ Item - This tool prompts you to input in a RQ Item index
   number and output module number to grab the image sequence source and start
   and end frames from. This is helpful in that, if you've got a RQ Item that
   is set to render to an image sequence and you want to delete frames from
   that sequence, you don't have to browse for the image sequence, it is taken
   from the output module of your selected RQ Item!

Future versions of the SSD script will contain even more tools to greatly
speed up the process of working with image sequences so stay tuned!

How To
======

I suppose you'd like some instructions? Don't worry, it's easy peasy:

Select an image sequence to work with:
--------------------------------------

 * Browse - Click on "Browse" to select a frame from an image sequence on your
   file system. Any frame from the image sequence will do! Alternatively, you
   can click on "Get RQ Item" to choose an image sequence file path from
   your render queue.

 * Get RQ Item Path - Click on "Get RQ Item" to select an output module to grab
   the image sequence path from. If there is only one RQ item and it only has
   one output module, this output module is automatically selected without any
   futher input. Start and end frames of the output module are automatically
   entered in as the start and end frames to delete.

 * Define the beginning and ending frame numbers for the
   section of the sequence that you want deleted. You can do this by manually
   entering in the frame numbers or by clicking on "Get Work Area" to
   automagically grab the in and out frame numbers of the workarea in the
   currently active composition.

Define the frame range to delete:
---------------------------------
 * Enter in a start and end frame for the range to delete. If you've used the
   "Get RQ Item" button, these are set as the frame range of the output module.
   You do not need to pad the frame numbers with zeroes.

Nuke those suckers!
-------------------
 * When you're ready, click on the "Perform Delete" button to begin deletion.
   Don't worry, a confirmation prompt will appear asking you if you are really
   sure you want to delete the sequence section.

 * Feeling a little bit insecure? That's ok, click on the "Perform test only"
   checkbox to indicate you want to perform a dry run and verify the files that
   you were wanting to delete will actually be deleted. When checked, no
   confirmation prompt is displayed since no deletion is performed.

Done. Note: The developer is not responsible for the loss of coffee breaks
normally used to wait out a sequence deletion.

Warranty
========

Unless required by applicable law or agreed to in writing, this software is
distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied. 
