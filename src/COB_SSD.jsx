/**
 * @fileoverview An image sequence section destroyer script.
 *
 * The point of this application is to allow the user to easily and quickly
 * delete a selected sequence of files directly from After Effects. It is most
 * useful when having to delete only a section of an image sequence for
 * re-render.
 *
 * Copyright 2011 Collin D Brooks <collin.brooks@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Collin D Brooks <collin.brooks@gmail.com>
 * @version 2.0.0
 */

/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, 
regexp: false, plusplus: true, bitwise: true, maxerr: 200, maxlen: 79, indent: 4 */

/*global app, $, File, Folder, alert, prompt, clearOutput, writeLn, write,
confirm, Window, Panel, localize, unescape, TimecodeDisplayType,
timeToCurrentFormat*/

/**
 * The main COB namespace
 * @namespace
 */
var COB = COB || {};

//Comment out for production
COB.SSD = undefined;
/**
 * The main namespace of the SSD script. Builds upon the COB namespace. Only
 * defined if COB.SSD is not already defined. This allows the script bypass
 * creation if it has already been created thus allowing it to run
 * faster when the panel or window is closed and then opened again.
 * When testing, set COB.SSD to undefined to make sure any changes are
 * processed.
 *
 * @name COB.SSD
 * @namespace
 * @param Object globalObj The global object from within After Effects.
 * @class
 * @returns Object The COB.SSD Object.
 */
COB.SSD = COB.SSD || (function SSD(globalObj) {

// Private Properties:
//----------------------------------------------------------------------------
/**#@+
 * @private
 * @inner
 */
    /**
     * A reference to COB.SSD's 'this' object.
     * @type {COB.SSD}
     */
    var that = this,
        debug = true,

        /**
         * Defines the slash used by this operating system. \ for Windows and /
         * for everything else.
         * @type {String}
         * @name COB.SSD-osSlash
         */
        osSlash = ($.os.indexOf("Mac") !== -1) ? "/" : "\\",

        /**
         * The version of After Effects currently running this script.
         * @type {Number}
         * @name COB.SSD-AEVersion
         */
        AEVersion = parseFloat(app.version),

        outputLn = (function (output) {
            if (debug) {
                return function (output) {
                    $.writeln(output);
                };
            } else {
                return function () {
                    return;
                };
            }
        }());

    #include "lang/en.jsxinc";

    #include "inc/progressKeeper.jsxinc";
    #include "inc/EventManager.jsxinc";
/**#@-*/

 // Public Properties:
 //----------------------------------------------------------------------------
    /**
     * The version of this script.
     * @type {String}
     * @fieldOf COB.SSD
     */
    this.version = "v2.0.0";

    /**
     * The name of this script.
     * @type {String}
     * @fieldOf COB.SSD
     */
    this.scriptName = "Image Sequence Section Destroyer";

    /**
     * The name of this scripts' author.
     * @type {String}
     * @fieldOf COB.SSD
     */
    this.author = "Collin D. Brooks <collin.brooks@gmail.com>";

    /**
     * The default file location string to bring up in the IS browse dialog
     * window.
     * @fieldOf COB.SSD
     * @type {String}
     */
    this.defaultFileLocation = "";

    /**
     * The first frame of the section to delete. Set by UI.
     * @fieldOf COB.SSD
     * @type {Number}
     */
    this.myFirstFrame = null;

    /**
     * The last frame of the section to delete. Set by UI.
     * @fieldOf COB.SSD
     * @type {Number}
     */
    this.myLastFrame = null;

    /**
     * The render queue item object the user has selected to reference.
     * @fieldOf COB.SSD
     * @type {Number}
     */
    this.myRQItem = 0;

    /**
     * The render queue item's output module object the user has selected to
     * reference.
     * @fieldOf COB.SSD
     * @type {OutputModule}
     */
    this.myOutputMod = null;

    //Include the Sequence Class
    #include "inc/Sequence.jsxinc";

    //The IS Object
    this.IS = new this.Sequence();
    /*this.RQItemIS = new this.Sequence();*/

// Public Methods:
//----------------------------------------------------------------------------
    #include "inc/UI.jsxinc";

    /**
     * Initializes script.
     * @returns Nothing.
     */
    this.init = function () {
        this.IS.init();

        //Show the UI.
        this.UI.show();
    };


// Private Methods:
//----------------------------------------------------------------------------

    /**
     * Displays the help documentation to the user.
     * @returns Nothing.
     */
    function help() {
        var l = localize,
            helpWindow = new Window("dialog",
					that.scriptName + " Help",
					undefined,
					{resizeable: false}
					);

        helpWindow.grp = helpWindow.add(
            "group { orientation: 'column', margins:0," +
                "alignment: ['fill','fill'], size: [350, 450]," +
                    "content: EditText {properties: {multiline:true}," +
                    "alignment: ['fill', 'fill']," +
                        "size: [350,430]}," +
                    "b: Button {text: 'Ok'}" +
            "}");

        helpWindow.grp.b.onClick = function () {
            helpWindow.close();
        };

        helpWindow.layout.layout(true);
        helpWindow.center();
        helpWindow.grp.content.text = l(lang.help);
        helpWindow.show();
    }

    /**
     * Opens a File dialog box allowing the user to select a file from an image
     * sequence.
     * @param {String} fileDialogText The text to display as the title of the
     * file dialog window.
     * @param {String} [folderLocation] The folder location to start the
     * browsing in.
     * @returns {File} The selected file.
     */
    function browse(fileDialogText, folderLocation) {
        return File.openDialog(fileDialogText, folderLocation);
    }

    /**
     * Sets the RQ Item either by selecting the only RQ Item available or by
     * user input.
     * @returns {Bool}
     */
    function getRQItem() {

        var myOutputModNum,
            myRQItemNum,
            numRQItems = app.project.renderQueue.numItems,
            numOutputModules,
            l = localize;

        //Are there RQ items?
        if (numRQItems !== 0) {

            //Is there only one render queue item?
            if (numRQItems === 1) {
                //If there is only one render queue item
                myRQItemNum = 1;
            } else {
                //Determin the render queue item to use
                myRQItemNum = parseInt(prompt(l(lang.rqNumPrompt), ""), 10);
            }

            if (myRQItemNum === null) {
                //The user cancelled the dialog. Return false
                return false;
            } else if (myRQItemNum > numRQItems ||
                    myRQItemNum <= 0 ||
                    isNaN(myRQItemNum)) {
                //The number entered is not a valid render queue item
                alert(l(error.NON_VALID_RQ_ITEM));
                return false;
            } else {
                //Determine the render queue item based upon the number entered
                that.myRQItem = app.project.renderQueue.item(myRQItemNum);

                numOutputModules = that.myRQItem.numOutputModules;

                if (numOutputModules !== 1) {
                    //There is more than one output module, 
                    //which one should we use?
                    myOutputModNum = prompt(l(lang.omNumPrompt), "");
                } else {
                    myOutputModNum = 1;
                }

                if (myOutputModNum === null || myOutputModNum === "") {
                    //The user cancelled the promp
                    return false;
                } else {
                    if (myOutputModNum > 0 &&
                            myOutputModNum <= numOutputModules &&
                            !isNaN(myOutputModNum)) {
                        //Make sure the user entered a valid outputModule index
                        //number.
                        that.myOutputMod = that.myRQItem.outputModules[
                            parseInt(myOutputModNum, 10)
                        ];
                        return true;
                    } else {
                        //The user entered a bad outputModule index number.
                        alert(l(error.NON_VALID_OM_ITEM, myOutputModNum));
                        return false;
                    }
                }
            }
        } else {
            //There aren't any render queue items!
            alert(l(error.NO_RQ_ITEMS));
            return false;
        }
    }

    /**
     * Grabs an Image Sequence path from a user-selected render queue item.
     * @returns Nothing.
     */
    function getRQItemPath() {
        var theFile, displayType, timeSpanStart, timeSpanEnd, compFrameRate,
            setStartAndEnd;

        isAECS55 = (AEVersion === 10.5) ? false : true;

        if (getRQItem() !== false) {
            theFile = File.decode(that.myOutputMod.file.fsName);

            if (theFile !== null && theFile.lastIndexOf("#") !== -1) {

                try {
                    that.IS.addSequence(theFile);

                    if (!isAECS55) {
                        projTimecodeDisplayType = app.project.timecodeDisplayType;
                        TimecodeDisplayTypeEnum = TimecodeDisplayType;
                    } else {
                        projTimecodeDisplayType = app.project.timeDisplayType;
                        TimecodeDisplayTypeEnum = TimeDisplayType;
                    }

                    //Get the current timecode display type so we can switch to
                    //frames, record the start and stop frame numbers and then
                    //set the timecode display back to the original setting.
                    displayType = projTimecodeDisplayType;

                    //Set the display type to frames
                    projTimecodeDisplayType = TimecodeDisplayTypeEnum.FRAMES;
                    timeSpanStart = that.myRQItem.timeSpanStart;
                    timeSpanEnd = timeSpanStart +
                        that.myRQItem.timeSpanDuration;

                    compFrameRate = that.myRQItem.comp.frameRate;

                    //Set the start and end frames based upon the
                    //start and end frames of the selected RQ item
                    that.UI.setStartFrame(
                        timeToCurrentFormat(timeSpanStart, compFrameRate)
                    );
                    that.UI.setEndFrame(
                        timeToCurrentFormat(timeSpanEnd, compFrameRate) - 1
                    );

                    //Reset the display type to the original setting
                    projTimecodeDisplayType = displayType;

                } catch (e) {
                    alert(e);
                }
            } else {
                alert(localize(error.NON_VALID_SEQUENCE));
            }
        }
    }

    /**
     * Sets the start and end frame numbers based upon the workarea's start and
     * stop point in the selected composition. If there is no active
     * composition, error.NO_ACTIVE_COMP is alerted.
     * @returns Nothing.
     */
    function getWorkArea() {
        var activeComp = app.project.activeItem,
            frameDur,
            start,
            end;

        if (activeComp === null) {
            alert(localize(error.NO_ACTIVE_COMP));
        } else {
            frameDur = activeComp.frameDuration;
            start = activeComp.workAreaStart;
            end = activeComp.workAreaDuration;

            that.UI.setStartFrame(Math.floor(start / frameDur));
            that.UI.setEndFrame(
                Math.floor(
                    (end / frameDur) +
                        (start / frameDur)
                ) - 1
            );
        }
    }

    /**
     * Resets the start and end frame fields in the UI when a new image
     * sequence is selected.
     * @returns Nothing.
     */
    function resetSequenceFrames() {
        outputLn("resetSequenceFrames()...");

        outputLn("clearing start and end fields");
        //Clear the start and end fields since this is a new image
        //sequence.
        that.UI.setStartFrame("");
        that.UI.setEndFrame("");

        outputLn("... end resetSequenceFrames()");
    }

    /**
     * Sets the sequence to be that of the currently selected sequence in the
     * dropdown menu.
     * @returns Nothing.
     */
    function getISFromDropDown() {
        outputLn("getISFromDropDown()...");

        that.IS.processSequence(that.UI.getISLocation());

        outputLn("... end getISFromDropDown()...");
    }

    /**
     * Runs through the process of getting the user selected IS from the Browse
     * button.
     * @returns Nothing.
     */
    function getISFromBrowse() {
        outputLn("getISFromBrowse()...");

        var theFile;

        theFile = browse(localize(lang.selectIS));

        if (theFile !== null && theFile !== false) {

            theFile = theFile.fullName;

            outputLn("theFile: " + theFile);

            /*try {*/
                if (theFile.lastIndexOf(".aep") === -1) {
                    outputLn("theFile is not an aep file.");
                    that.IS.setSequence(theFile);
                } else {
                    alert(localize(error.AE_SEQ_SELECTED));
                }
            /*} catch (e) {*/
                /*alert(e);*/
            /*}*/
        }
        outputLn("... end getISFromBrowse()");
    }

    /**
     * Verifies the GUI input is valid.
     * @returns {Bool} True if the input is valid. False if not.
     */
    function verifyInput(first, last) {
        var l = localize;

        //CHECK TO MAKE SURE BEGINNING AND ENDING NUMBERS ARE OK
        if (!that.IS.sequenceSet) {
            alert(l(error.NO_SEQUENCE_SET));
            return false;
        } else if (last < first) {
            alert(l(error.START_FRAME_BGT_STOP, first));
            return false;
        } else if (isNaN(first) || isNaN(last)) {
            alert(l(error.FRAMES_NAN));
            return false;
        }

        return true;
    }

    /**
     * Initiates the deletion of the selected IS after verifying the user's
     * input.
     * @returns Nothing.
     */
    function performDelete() {
        var startNum = parseInt(that.UI.getStartFrame(), 10),
            endNum = parseInt(that.UI.getEndFrame(), 10),
            testOnly = that.UI.testOnly(),
            l = localize,
            doDelete = false;

        if (verifyInput(startNum, endNum)) {
            //User input is good... carry on.
            if (testOnly) {
                //Only testing, don't worry about asking the user.
                doDelete = true;
            } else {
                //Make sure the user is sure.
                if (confirm(l(
                        lang.confirmDelete,
                        that.IS.getPathWithRange(startNum, endNum)
                    ))) {
                    doDelete = true;
                }
            }
        }

        if (doDelete) {
            //Perform the deletion
            that.IS.deleteSequenceSection(startNum, endNum, testOnly);
        }

    }

// Main:
//----------------------------------------------------------------------------

    //Setup the UI events
    this.UI.addEventListener("onBrowse", getISFromBrowse);
    this.UI.addEventListener("onGetRQItemPath", getRQItemPath);
    this.UI.addEventListener("onGetWorkArea", getWorkArea);
    this.UI.addEventListener("onPerformDelete", performDelete);
    this.UI.addEventListener("onHelp", help);
    this.UI.addEventListener("onISLocationChange", getISFromDropDown);

    this.IS.addEventListener('onSequenceListUpdate', function () {
        outputLn("onSequenceListUpdate fired");
        that.UI.setISLocationsList(that.IS.getSequenceList());
    });
    this.IS.addEventListener('onProcessSequence', function () {
        resetSequenceFrames();
    });

    return this;

}(this));

COB.SSD.init();
