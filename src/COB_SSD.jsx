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
 * @version 1.0.1
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
COB.ISSD = undefined;
/**
 * The main namespace of the ISSD script. Builds upon the COB namespace. Only
 * defined if COB.ISSD is not already defined. This allows the script bypass
 * creation if it has already been created thus allowing it to run
 * faster when the panel or window is closed and then opened again.
 * When testing, set COB.ISSD to undefined to make sure any changes are
 * processed.
 *
 * @name COB.ISSD
 * @namespace
 * @param Object globalObj The global object from within After Effects.
 * @class
 * @returns Object The COB.ISSD Object.
 */
COB.ISSD = COB.ISSD || (function ISSD(globalObj) {

// Private Properties:
//----------------------------------------------------------------------------
/**#@+
 * @private
 * @inner
 */
    /**
     * A reference to COB.iSSD's 'this' object.
     * @type {COB.ISSD}
     */
    var that,

        /**
         * Defines the slash used by this operating system. \ for Windows and /
         * for everything else.
         * @type {String}
         * @name COB.ISSD-osSlash
         */
        osSlash = ($.os.indexOf("Mac") !== -1) ? "/" : "\\",

        /**
         * The version of After Effects currently running this script.
         * @type {Number}
         * @name COB.ISSD-AEVersion
         */
        AEVersion = parseFloat(app.version),

        /**
         * Language dictionary for localized strings.
         * @type {Object}
         * @name COB.ISSD-lang
         */
        lang,

        /**
         * Error Object containing enumerated error names and their respective
         * error messages.
         * @type {Object}
         * @name COB.ISSD-error
         */
        error,

        /**
         * Class that keeps track of events and fires them when called.
         * @private
         * @class
         * @name COB.ISSD-EventManager
         */
        EventManager = function () {
            /* Event Listeners */
            var events = [];
            this.addEventListener = function (e, f) {
                events[e] = function () {
                    f();
                };
            };

            this.removeEventListener = function (e) {
                events[e] = null;
            };

            this.fire = function (e) {
                return function () {
                    if (typeof events[e] === "function") {
                        events[e]();
                    } else {
                        return null;
                    }
                };
            };
            return this;
        },

        /**
         * Keeps track of the progress made when deleting image sequences and
         * defines different methods for displaying said progress depending on
         * the version of After Effects currently being run.
         * @private
         * @inner
         * @namespace
         * @name COB.ISSD-progressKeeper
         */
        progressKeeper = (function () {
            var winGfx, darkColorBrush, g, res, thePal,
                l = localize, //Shorthand for localize

                //For AE < 9
                currentPercentage,

                //Private Methods
                init,
                updateProgress,
                resetProgress,
                setStatus,
                end;


            // Because the progress bar was poorly implemented in CS3, if the
            // user is currently running a version before CS4 (9.0), show the
            // progress by updating the application info panel. To do this, the
            // code below defines the following methods depending on the
            // version of AE:
            //     init
            //     updateProgress
            //     setStatus
            //     end


            //If the version of AE is greather than CS4
            if (AEVersion >= 9) {

                thePal = new Window("palette",
                        "Progress...",
                        undefined,
                        {resizeable: false}
                        );
                if (thePal !== null) {
                    //UI RESOURCE SETUP
                    res = "group { orientation: 'column', margins:0," +
                        "alignment: ['fill','fill'], size: [350, 450]," +
                        "status: StaticText {" +
                            "alignment: ['left', 'fill']," +
                            "text: ''," +
                            "size: [350, 25]," +
                            "properties: {multiline: true}," +
                        "}," +
                        "progressBar: Progressbar {" +
                            "size: [325, 20]" +
                        "}," +
                        "okButton: Button { text: 'Ok' }" +
                    "}";

                    g = thePal.add(res);

                    thePal.layout.layout(true);

                    thePal.onResizing = thePal.onResize = function () {
                        this.layout.resize();
                    };

                    g.okButton.onClick = function () {
                        thePal.close();
                    };

                    // Workaround to ensure the edittext text color is black,
                    // even at darker UI brightness levels
                    winGfx = thePal.graphics;
                    darkColorBrush = winGfx.newPen(
                        winGfx.BrushType.SOLID_COLOR,
                        [0, 0, 0],
                        1
                    );

                }

                init = function (status, title) {
                    //Reset the progressbar value and set the title
                    resetProgress(0);
                    g.okButton.visible = false;
                    g.text = title;
                    g.status.text = status;

                    thePal.layout.layout(true);
                    thePal.center();
                    thePal.update();
                    thePal.show();
                };

                updateProgress = function (total, progress) {
                    g.progressBar.value = (progress / total) * 100;
                };

                resetProgress = function () {
                    g.progressBar.value = 0;
                    g.progressBar.visible = true;
                };

                setStatus = function (s) {
                    g.status.text = s;
                };

                end = function (m) {
                    //Perform any UI update
                    setStatus(m);
                    g.progressBar.visible = false;
                    g.okButton.visible = true;
                    thePal.layout.layout(true);
                };

            } else {

                init = function (status) {
                    clearOutput();
                    writeLn(status);
                    //Reset the current percentage to a value that it will
                    //never be in the updateProgress function.
                    currentPercentage = -1;
                };

                updateProgress = function (total, progress) {
                    var percentage = Math.round((progress / total) * 100);
                    if (percentage % 20 === 0 &&
                            percentage !== currentPercentage) {
                        write(percentage + "% ");
                        currentPercentage = percentage;
                    }
                };

                end = function (m) {
                    clearOutput();
                    alert(m);
                };
            }

            /** @scope COB.ISSD-progresskeeper */
            return {
                /**
                 * Initializes the progress keeper.
                 * @param {String} status A status string to use as the
                 * progress header.
                 * @param {String} title The title to use for the progress
                 * window if the current version of After Effects is greater
                 * than 8.
                 * @returns Nothing.
                 */
                init: init,

                /**
                 * Updates the current progress.
                 * @param {Number} total The total number of frames currently
                 * being deleted.
                 * @param {Number} progress The current frame being deleted.
                 * @returns Nothing.
                 */
                updateProgress: updateProgress,

                /**
                 * Ends the progress keeping and displays a message to the
                 * user.
                 * @param {String} m The message to display to the user.
                 * @returns Nothing.
                 */
                end: end
            };
        }());
/**#@-*/

 // Public Properties:
 //----------------------------------------------------------------------------
    /**
     * The version of this script.
     * @type {String}
     * @fieldOf COB.ISSD
     */
    this.version = "v1.0.1";

    /**
     * The name of this script.
     * @type {String}
     * @fieldOf COB.ISSD
     */
    this.scriptName = "Image Sequence Section Destroyer";

    /**
     * The name of this scripts' author.
     * @type {String}
     * @fieldOf COB.ISSD
     */
    this.author = "Collin D. Brooks <collin.brooks@gmail.com>";

    /**
     * The default file location string to bring up in the IS browse dialog
     * window.
     * @fieldOf COB.ISSD
     * @type {String}
     */
    this.defaultFileLocation = "";

    /**
     * The first frame of the section to delete. Set by UI.
     * @fieldOf COB.ISSD
     * @type {Number}
     */
    this.myFirstFrame = null;

    /**
     * The last frame of the section to delete. Set by UI.
     * @fieldOf COB.ISSD
     * @type {Number}
     */
    this.myLastFrame = null;

    /**
     * The render queue item object the user has selected to reference.
     * @fieldOf COB.ISSD
     * @type {Number}
     */
    this.myRQItem = 0;

    /**
     * The render queue item's output module object the user has selected to
     * reference.
     * @fieldOf COB.ISSD
     * @type {OutputModule}
     */
    this.myOutputMod = null;

    /**
     * The class containing all the information about the Image Sequence
     * selected by the user.
     * @name COB.ISSD.Sequence
     * @class
     */
    this.Sequence = function () {
        var fullName = "",
            path = "",
            fileBeginning = "",
            fileEnd = "",
            numDigits = 0,
            //Does this IS have pounds in it? This affects how it is handled
            containsPounds,

            /* TODO:
             * THE FOLLOWING ARRAYS SHOULD HOLD A LIST OF THE DELETED, SKIPPED,
             * AND TEST-DELETED FRAMES
             */

            deleted = [],
            skipped = [],
            testDeleted = [];

        this.sequenceSet = false;

        /* TODO:
         * FOR VERSION 2: INSERT A WAY TO TRACK THE DIFFERENT JOBS PERFORMED ON
         * THIS IMAGE SEQUENCE. THE JOB LIST WILL NEED TO BE CLEARED ON INIT()
         */

        /**
         * Initializes the sequence by slicing the selected file into its
         * different parts (i.e. path, fileName, fileBeginning, etc.).
         * @param {String} filePath The file system path to use as the
         * sequence's source.
         * @returns None.
         * @throws error.NON_VALID_SEQUENCE
         */
        this.init = function (filePath) {
            var endSlash = filePath.lastIndexOf(osSlash),
                ISPath = filePath.substring(0, endSlash + 1),
                fullFileName = filePath.substring(
                    ISPath.length,
                    filePath.length
                ),

                //Check to see if the file path sent to us has already had the
                //digits replaced with #. This can happen if the file path is
                //sent from the source of an output module and it is an Image
                //Sequence
                slicer,
                lastNumGroup,
                digits,
                results;

            containsPounds = (fullFileName.lastIndexOf("#") !== -1);

            slicer = (!containsPounds) ? /(\d+)/g : /(#+)/g;
            /*$.writeln(slicer);*/

            if (slicer.test(fullFileName)) {
                results = fullFileName.match(slicer);

                digits = results[results.length - 1];
                numDigits = digits.length;
                lastNumGroup = fullFileName.lastIndexOf(digits);
                fileBeginning = fullFileName.substring(0, lastNumGroup);

                fileEnd = fullFileName.substring(lastNumGroup + digits.length,
                        fullFileName.length);

                //If the file had pounds signs in it, get rid of the brackets
                if (containsPounds) {

                    fileBeginning = fileBeginning.substr(
                        0,
                        fileBeginning.length - 1
                    );

                    fileEnd = fileEnd.substr(
                        1,
                        fileEnd.length - 1
                    );

                }

                fullName = filePath;
                path = ISPath;

                this.sequenceSet = true;
            } else {
                throw new Error(localize(error.NON_VALID_SEQUENCE));
            }
        };

        this.getISFileString = function (frameNumber) {
            return path +
                fileBeginning +
                this.getFrameNum(frameNumber) +
                fileEnd;
        };

        this.getFileNameWithPounds = function () {
            var poundString = "",
                i;

            poundString += "[";

            for (i = 0; i < numDigits; i += 1) {
                poundString += "#";
            }

            poundString += "]";

            return fileBeginning +
                poundString +
                fileEnd;
        };

        this.getFileNameWithRange = function (start, end) {
            return path + fileBeginning +
                "[" + start + "-" + end + "]" + fileEnd;
        };

        this.getFrameNum = function (n) {
            var numString = String(n),
                numLength = numString.length,
                i = 0,
                numZeros = numDigits - numLength,
                addZeros = "";

            while (i < numZeros) {
                addZeros = addZeros + "0";
                i += 1;
            }
            return addZeros + numString;
        };

        this.toString = function () {
            var me = "";

            me += "fullName: " + fullName + "\n";
            me += "path: " + path + "\n";
            me += "fileBeginning: " + fileBeginning + "\n";
            me += "numDigits " + numDigits + "\n";
            me += "fileEnd: " + fileEnd + "\n";

            return me;
        };

        this.getPath = function () {
            return path;
        };

        /**
         * Deletes files from this image sequence based upon the start and end
         * frame numbers sent and if testOnly is false or undefined.
         * @param {Int} start The start frame number of the section of the
         * sequence to delete. This does not need leading zeroes added to fit
         * the number of digits in the sequence name; this is done
         * automatically.
         * @param {Int} end The end frame number of the section of the sequence
         * to delete. This does not need leading zeroes added to fit the number
         * of digits in the sequence name; this is done automatically.
         * @param {Bool} [testOnly] Whether or not to actually delete the files
         * belonging to the defined section of the sequence. Defaults to false.
         * @returns {Array} An array with the number of files deleted as the 0
         * index and the number of files skipped in the 1 index.
         */
        this.deleteSequenceSection = function (start, end, testOnly) {
            var i = start,
                currentFileString,
                currentFile,
                isTest = testOnly || false,
                filesDeleted = 0,
                filesSkipped = 0,
                skippedInARow = 0,
                skipProgressThreshold = 5000,
                currentStatus,
                currentTitle,
                total = end - start + 1,
                progress = 0,
                alertText = "",
                l = localize;

            //Initialize the progress keeper
            if (isTest) {
                currentTitle = l(lang.simProgressTitle);
                currentStatus = l(lang.simProgressStatus);
            } else {
                currentTitle = l(lang.progressTitle);
                currentStatus = l(lang.progressStatus);
            }

            currentStatus += start + " - " + end;

            progressKeeper.init(currentStatus, currentTitle);

            //Go through the start and end frames and delete them if this is
            //not a test.
            for (i; i <= end; i += 1) {
                currentFileString = this.getISFileString(i);
                currentFile = new File(currentFileString);

                if (currentFile.exists) {

                    //Remove this file if this is not a test.
                    if (!isTest) {
                        currentFile.remove();
                    }

                    filesDeleted += 1;
                    progress += 1;

                    //Reset the file skipped in a row
                    skippedInARow = 0;

                    //Update the progress
                    progressKeeper.updateProgress(total, progress);
                } else {
                    filesSkipped += 1;
                    skippedInARow += 1;
                    progress += 1;

                    if (AEVersion < 9 ||
                            skippedInARow === skipProgressThreshold) {
                        progressKeeper.updateProgress(total, progress);
                        skippedInARow = 0;
                    }
                }

            }

            if (testOnly) {
                alertText = localize(lang.wouldHaveDeleted,
                        filesDeleted,
                        filesSkipped);
            } else {
                alertText = localize(lang.deleted,
                        filesDeleted,
                        filesSkipped);
            }

            progressKeeper.end(alertText);

            return true;
        };


        return this;
    };

    this.IS = new this.Sequence();
    this.RQItemIS = new this.Sequence();

// Private Property Definitions:
//----------------------------------------------------------------------------

    that = this;
    lang = {
        browsePanelTitle: {en: "Image Sequence"},
        defaultISLocText: {en: "Browse for the sequence"},
        browseButton: {en: "Browse..."},
        toolsPanel: {en: "Tools"},
        getRQItem: {en: "Get RQ Item"},
        getWorkArea: {en: "Get Work Area"},
        sectionSelPanel: {en: "Section Selection"},
        sectionBegin: {en: "Section Begin"},
        sectionEnd: {en: "Section End"},
        performTest: {en: "Perform Test Only"},
        deleteButton: {en: "Perform Delete"},
        omNumPrompt: {en: "Enter in the number of the RQ " +
            "Item's Output Module:"},
        selectIS: {en: "Select the first file of the image sequence:"},
        helpButton: {en: "Help"},
        rqNumPrompt: {en: "Enter in the number of the Render Queue " +
            "Item's Index:"},
        simProgressTitle: {en: "Simulating Deletion..."},
        simProgressStatus: {en: "Simulating Deletion of frames "},
        progressTitle: {en: "Deleting..."},
        progressStatus: {en: "Deleting frames "},
        deletingSegment: {en: "DELETING SEGMENT:"},
        percentComplete: {en: "% COMPLETE:"},
        wouldHaveDeleted: {en: "%1 file(s) would have been deleted. " +
            "%2 file(s) would have been skipped."},
        deleted: {en: "%1 file(s) deleted. %2 file(s) skipped."},
        confirmDelete: {en: "Are you sure you want to delete the following?" +
            "\n\n%1"},
        help: {en: this.scriptName + " " + this.version + " Help\n\n" +
        "The point of COB_SSD (Sequence Section Destroyer) is to aid in " +
        "the deletion of portions (or all) of a selected image sequence " +
        "directly from within After Effects.\n\n" +
        "Select an image sequence to work with:\n" +
        "--------------------------------------\n\n" +

        " * Browse - Click on \"Browse\" to select a frame from an image " +
            "sequence on your file system. Any frame from the image " +
            "sequence will do! Alternatively, you can click on \"Get RQ " +
            "Item\" to choose an image sequence file path from your " +
            "render queue.\n\n" +

        " * Get RQ Item Path - Click on \"Get RQ Item\" to select an output " +
            "module to grab the image sequence path from. If there is only " +
            "one RQ item and it only has one output module, this output " +
            "module is automatically selected without any futher input. " +
            "Start and end frames of the output module are automatically " +
            "entered in as the start and end frames to delete.\n\n" +

        " * Define the beginning and ending frame numbers for the section of" +
            " the sequence that you want deleted. You can do this by manually" +
            " entering in the frame numbers or by clicking on \"Get Work " +
            "Area\" to automagically grab the in and out frame numbers of " +
            "the workarea in the currently active composition.\n\n" +

        "Define the frame range to delete:\n" +
        "---------------------------------\n" +
        " * Enter in a start and end frame for the range to delete. If " +
            "you've used the \"Get RQ Item\" button, these are set as " +
            "the frame range of the output module. You do not need to " +
            "pad the frame numbers with zeroes.\n\n" +

        "Nuke those suckers!\n" +
        "-------------------\n" +
        " * When you're ready, click on the \"Perform Delete\" button " +
            "to begin deletion. Don't worry, a confirmation prompt will " +
            "appear asking you if you are really sure you want to delete " +
            "the sequence section.\n\n" +

        " * Feeling a little bit insecure? That's ok, click on the " +
            "\"Perform test only\" checkbox to indicate you want to " +
            "perform a dry run and verify the files that you were " +
            "wanting to delete will actually be deleted. When checked, no " +
            "confirmation prompt is displayed since no deletion is " +
            "performed.\n\n" +

        "Done. Note: The developer is not responsible for the loss of " +
        "coffee breaks normally used to wait out a sequence deletion."}
    };

    error = {
        NON_VALID_RQ_ITEM: {en: "The number you entered is not a valid " +
            "render queue item index."},
        NON_VALID_OM_ITEM: {en: "The render queue item does not have an " +
            "output module with an index of %1."},
        NON_VALID_RQ_SEQUENCE: {en: "It doesn't seem like the path " +
            "is a valid sequence."},
        NO_ACTIVE_COMP: {en: "Please select the composition whose " +
            "work area you would like to get and then retry."},
        EMPTY_FRAME_VALUE: {en: "Both the beginning and ending " +
            "frames must be set"},
        START_FRAME_BGT_STOP: {en: "Ending image number must be " +
                "greater than the beginning " +
                "image number (%1)"},
        FRAMES_NAN: {en: "Frame Values must be numbers!"},
        NON_VALID_SEQUENCE: {en: "The selected file does not seem to be" +
                " a part of a sequence."},
        NO_SEQUENCE_SET: {en: "You must select an image sequence to operate" +
                " on in order to perform the deletion!"},
        AE_SEQ_SELECTED: {en: "For reasons that I'm sure are clear, " +
                ".aep files cannot be selected!"}
    };


// Public Methods:
//----------------------------------------------------------------------------
    /**
     * The UI of the COB.ISSD script.
     * @fieldOf COB.ISSD
     */
    this.UI = (function showUI() {
        var winGfx,
            darkColorBrush,
            g, //Local pointer to thePal.grp
            res,
            l = localize, //Shorthand for localize
            /* UI */
            thePal = (globalObj instanceof Panel) ?
                globalObj :
                new Window("palette",
                    that.scriptName + " " + that.version,
                    undefined,
                    {resizeable: false}
                    ),
            /* Event Listeners */
            e = new EventManager();

        if (thePal !== null) {
            //UI RESOURCE SETUP
            res =
                "group {orientation: 'column', margins:-8, " +
                    "browsePanel: Panel {" +
                        "text: '" + l(lang.browsePanelTitle) + "'," +
                        "orientation: 'row'," +
                        "alignment: ['fill','fill']," +
                        "alignChildren: ['fill', 'bottom']," +
                        "margins:10," +
                        "ISLocation: StaticText {" +
                            "size: [220,20]," +
                            "text: '" + l(lang.defaultISLocText) + "'" +
                        "}," +
                        "browseButton: Button {" +
                            "text: '" + l(lang.browseButton) + "'," +
                        "}" +
                    "}," +
                    "one: Group {" +
                        "orientation: 'row'," +
                        "alignment: ['fill', 'fill']," +
                        "toolsPanel: Panel {" +
                            "text: '" + l(lang.toolsPanel) + "'," +
                            "orientation:'column'," +
                            "getRQItemPathButton: Button {" +
                                "text: '" + l(lang.getRQItem) + "'," +
                                "alignment: ['fill','fill']" +
                            "}" +
                            "getWorkAreaButton: Button {" +
                                "text: '" + l(lang.getWorkArea) + "'," +
                                "alignment: ['fill', 'fill']" +
                            "}" +
                        "}," +
                        "sectionSelectionPanel: Panel {" +
                            "text: '" + l(lang.sectionSelPanel) + "'," +
                            "orientation: 'column'," +
                            "alignment: ['fill','fill']," +
                            "row1: Group {" +
                                "orientation:'row'," +
                                "alignment: ['fill','fill']," +
                                "sectionBeginStaticText: StaticText {" +
                                    "text: '" +
                                        l(lang.sectionBegin) +
                                        "'," +
                                    "alignment: ['right', 'middle']" +
                                "}," +
                                "sectionBegin: EditText {" +
                                    "size: [50,20]," +
                                    "alignment: ['right', 'middle']" +
                                "}," +
                            "}," +
                            "row2: Group {" +
                                "orientation: 'row'," +
                                "alignment: ['fill','fill']," +
                                "sectionEndStaticText: StaticText {" +
                                    "text: '" +
                                        l(lang.sectionEnd) +
                                    "'," +
                                    "alignment: ['right', 'middle']}," +
                                "sectionEnd: EditText {" +
                                    "size:[50,20]," +
                                    "alignment: ['right', 'middle']" +
                                "}" +
                            "}" +
                        "}" +
                    "}," +
                    "two: Group {" +
                        "orientation:'row'," +
                        "alignment: ['fill','fill']," +
                        "testOnlyCheckbox: Checkbox {" +
                            "text: '" + l(lang.performTest) + "'" +
                        "}," +
                        "buttonGroup: Group {" +
                            "orientation: 'row'," +
                            "alignment: ['fill', 'fill']," +
                            "performDeleteButton: Button {" +
                                "text: '" +
                                    l(lang.deleteButton) +
                                "'" +
                            "}," +
                            "helpButton: Button {" +
                                "alignment: ['right', 'fill']," +
                                "text: '" + l(lang.helpButton) + "'" +
                            "}," +
                        "}," +
                    "}" +
                "}";

            g = thePal.add(res);

            thePal.layout.layout(true);

            thePal.onResizing = thePal.onResize = function () {
                this.layout.resize();
            };

            //g.progressBar.visible = false;
            //g.status.visible = false;

            // Workaround to ensure the edittext text color is black,
            // even at darker UI brightness levels
            winGfx = thePal.graphics;
            darkColorBrush = winGfx.newPen(
                winGfx.BrushType.SOLID_COLOR,
                [0, 0, 0],
                1
            );

            /*g.browsePanel.ISLocation.graphics.*/
                    /*foregroundColor = darkColorBrush;*/
            /*g.one.sectionSelectionPanel.row1.sectionBegin.*/
                    /*graphics.foregroundColor = darkColorBrush;*/
            /*g.one.sectionSelectionPanel.row2.sectionEnd.*/
                    /*graphics.foregroundColor = darkColorBrush;*/

        }
        //Assign events to fire
        g.browsePanel.browseButton.onClick = e.fire("onBrowse");
        g.one.toolsPanel.getRQItemPathButton.onClick =
            e.fire("onGetRQItemPath");
        g.one.toolsPanel.getWorkAreaButton.onClick =
            e.fire("onGetWorkArea");
        g.two.buttonGroup.performDeleteButton.onClick =
            e.fire("onPerformDelete");
        g.two.buttonGroup.helpButton.onClick = e.fire("onHelp");

        //Public methods
        /** @scope COB.ISSD.UI */
        return {
            show: function () {
                if (thePal instanceof Window) {
                    thePal.center();
                    thePal.show();
                } else {
                    thePal.layout.layout(true);
                }
            },
            addEventListener: e.addEventListener,
            removeEventListener: e.removeEventListener,
            setISLocation: function (t) {
                g.browsePanel.ISLocation.text = unescape(t);
            },
            setISLocationHelpTip: function (t) {
                g.browsePanel.ISLocation.helpTip = t;
            },
            setStartFrame: function (f) {
                g.one.sectionSelectionPanel.row1.
                    sectionBegin.text = f;
            },
            setEndFrame: function (f) {
                g.one.sectionSelectionPanel.row2.
                    sectionEnd.text = f;
            },
            getStartFrame: function () {
                return g.one.sectionSelectionPanel.row1.sectionBegin.text;
            },
            getEndFrame: function () {
                return g.one.sectionSelectionPanel.row2.sectionEnd.text;
            },
            testOnly: function () {
                return g.two.testOnlyCheckbox.value;
            },
            updateISLocation: function (path, filename) {
                this.setISLocation(filename);
                this.setISLocationHelpTip(path);
            }
        };
    }());

    /**
     * Shows the UI of the COB.ISSD script.
     * @returns Nothing.
     */
    this.init = function () {
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

        //
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
    }

    function getRQItemPath() {
        var theFile,
            displayType,
            timeSpanStart,
            timeSpanEnd,
            compFrameRate,
            isAECS55,
            projTimecodeDisplayType,
            TimecodeDisplayTypeEnum;

        isAECS55 = (AEVersion === 10.5) ? true : false;


        if (getRQItem() !== false) {
            theFile = File.decode(that.myOutputMod.file.fsName);

            if (theFile !== null && theFile.lastIndexOf("#") !== -1) {

                try {
                    that.IS.init(theFile);

                    //Update the IS path in the GUI
                    that.UI.updateISLocation(
                        that.IS.getPath(),
                        that.IS.getFileNameWithPounds()
                    );

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
     * Runs through the process of getting the user selected IS.
     * @returns Nothing.
     */
    function getIS() {
        var theFile;

        theFile = browse(localize(lang.selectIS));

        if (theFile !== null && theFile !== false) {

            theFile = theFile.fullName;
            try {
                if (theFile.lastIndexOf(".aep") === -1) {

                    //Slice the file path up and init the IS data.
                    that.IS.init(theFile);
                    //CHOP OFF NUMBERS AND EXTENSION

                    that.UI.updateISLocation(
                        that.IS.getPath(),
                        that.IS.getFileNameWithPounds()
                    );

                    //Clear the start and end fields since this is a new image
                    //sequence.
                    that.UI.setStartFrame("");
                    that.UI.setEndFrame("");
                } else {
                    alert(localize(error.AE_SEQ_SELECTED));
                }
            } catch (e) {
                alert(e);
            }
        }
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
                        that.IS.getFileNameWithRange(startNum, endNum)
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

    //Setup the UI onClick events
    this.UI.addEventListener("onBrowse", getIS);
    this.UI.addEventListener("onGetRQItemPath", getRQItemPath);
    this.UI.addEventListener("onGetWorkArea", getWorkArea);
    this.UI.addEventListener("onPerformDelete", performDelete);
    this.UI.addEventListener("onHelp", help);

    return this;

}(this));

COB.ISSD.init();
