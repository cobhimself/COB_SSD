/** * @fileoverview An Image Sequence Section Deleter script. * * The point of this application is to allow the user to easily and quickly * delete a selected sequence of files directly from After Effects. It is most * useful when having to delete only a section of an image sequence for * re-render. * * Copyright 2011 Collin D Brooks <collin.brooks@gmail.com> * * Licensed under the Apache License, Version 2.0 (the "License"); * you may not use this file except in compliance with the License. * You may obtain a copy of the License at * *   http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by applicable law or agreed to in writing, software * distributed under the License is distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See the License for the specific language governing permissions and * limitations under the License. * * @author Collin D Brooks <collin.brooks@gmail.com> * @version 4.1 *//*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: false, plusplus: true, bitwise: true, maxerr: 200, maxlen: 79, indent: 4 */                 /*global app, $, File, Folder, alert, prompt, clearOutput, writeLn, write,confirm, Window, Panel, localize*//** * The main COB.ISSD namespace * @namespace */var COB = COB || {};//Comment out for productionCOB.ISSD = undefined;/** * The main namespace of the ISSD script. Builds upon the COB namespace. Only * defined if COB.ISSD is not already defined. This allows the script bypass * creation if it has already been created thus allowing it to run * faster when the panel or window is closed and then opened again. * When testing, set COB.ISSD to undefined to make sure any changes are * processed. * * @param Object globalObj The global object from within After Effects. * @returns Object The COB.ISSD Object. */COB.ISSD = COB.ISSD || (function ISSD(globalObj) {// Private Properties://----------------------------------------------------------------------------    var that,        osSlash = ($.os.indexOf("Mac") !== -1) ? "/" : "\\",        AEVersion = parseInt(app.version, 10),        lang,        error,        EventManager,        progressKeeper;    EventManager = function () {        /* Event Listeners */        var events = [];        this.addEventListener = function (e, f) {            events[e] = function () {                f();            };        };        this.removeEventListener = function (e) {            events[e] = null;        };        this.fire = function (e) {            return function () {                if (typeof events[e] === "function") {                    events[e]();                } else {                    return null;                }            };        };        return this;    };    progressKeeper = (function () {        var winGfx, darkColorBrush, g, res, thePal,            l = localize, //Shorthand for localize            //Private Methods            init,            updateProgress,            setStatus,            end;        /**         * Because the progress bar was poorly implemented in CS3, if the         * user is currently running a version before CS4 (9.0), show the         * progress by updating the application info panel. To do this, the         * code below defines the following methods depending on the         * version of AE:         *     init         *     updateProgress         *     setStatus         *     end         */                //If the version of AE is greather than CS4        if (AEVersion >= 9) {            thePal = (globalObj instanceof Panel) ?                globalObj :                new Window("palette",                    "Progress...",                    undefined,                    {resizeable: false}                    );            if (thePal !== null) {                //UI RESOURCE SETUP                res = "group { orientation: 'column', margins:0," +                    "alignment: ['fill','fill'], size: [350, 450]," +                    "status: StaticText {" +                        "alignment: ['left', 'fill']," +                        "text: 'Deleting frames [%1-%2]...'," +                        "size: [350, 25]," +                        "properties: {multiline: true}," +                    "}," +                    "progressBar: Progressbar {" +                        "size: [325, 20]" +                    "}," +                    "okButton: Button { text: 'Ok' }" +                "}";                g = thePal.add(res);                                thePal.layout.layout(true);                thePal.onResizing = thePal.onResize = function () {                    this.layout.resize();                };                g.okButton.onClick = function () {                    thePal.close();                };                // Workaround to ensure the edittext text color is black,                // even at darker UI brightness levels                winGfx = thePal.graphics;                darkColorBrush = winGfx.newPen(                    winGfx.BrushType.SOLID_COLOR,                    [0, 0, 0],                    1                );            }            init = function (status, title) {                //Reset the progressbar value and set the title                resetProgress(0);                g.okButton.visible = false;                g.text = title;                g.status.text = status;                if (thePal instanceof Window) {                    thePal.layout.layout(true);                    thePal.center();                    thePal.show();                } else {                    thePal.layout.layout(true);                }            };            updateProgress = function (total, progress) {                g.progressBar.value = (progress / total) * 100;            };                        resetProgress = function () {                g.progressBar.value = 0;                g.progressBar.visible = true;            };            setStatus = function (s) {                g.status.text = s;            };            end = function (m) {                //Perform any UI update                setStatus(m);                g.progressBar.visible = false;                g.okButton.visible = true;                thePal.layout.layout(true);            };        } else {            init = function (status) {                clearOutput();                writeLn(status);            };            updateProgress = function (total, progress) {                var percentage = Math.round((progress / total) * 100);                if (percentage % 10 === 0) {                    /*clearOutput();*/                    write(percentage);                }            };                        end = function (m) {                clearOutput();                alert(m);            };        }        return {            init: init,            updateProgress: updateProgress,            end: end        };    }()); // Public Properties: //----------------------------------------------------------------------------    /**     * The version of this script.     */    this.version = "4.1";    /**     * The name of this script.     */    this.scriptName = "Image Sequence Section Deleter";    /**     * The name of this scripts' author.     */    this.author = "Collin Brooks <collin.brooks@gmail.com>";    this.defaultFileLocation = "";    this.myFirstFrame = null;    this.myLastFrame = null;    this.currentPercentage = 0;    //The render queue item object the user has selected to reference     this.myRQItem = "";    //The render queue item's output module object the user    //has selected to reference     this.myOutputMod = "";     /**     * The model containing all the information about the Image Sequence     * selected by the user.     */    this.Sequence = function () {        var fullName = "",            path = "",            fileBeginning = "",            fileEnd = "",            numDigits = 0,            /* TODO:             * THE FOLLOWING ARRAYS SHOULD HOLD A LIST OF THE DELETED, SKIPPED,             * AND TEST-DELETED FRAMES             */            deleted = [],            skipped = [],            testDeleted = [];        /* TODO:         * FOR VERSION 5: INSERT A WAY TO TRACK THE DIFFERENT JOBS PERFORMED ON         * THIS IMAGE SEQUENCE. THE JOB LIST WILL NEED TO BE CLEARED ON INIT()         */        /**         * Initializes the sequence by slicing the selected file into its         * different parts (i.e. path, fileName, fileBeginning, etc.).         * @param {String} filePath The file system path to use as the         * sequence's source.         * @returns None.         * @throws error.NON_VALID_SEQUENCE         */        this.init = function (filePath) {            var endSlash = filePath.lastIndexOf(osSlash),                ISPath = filePath.substring(0, endSlash + 1),                fullFileName = filePath.substring(                    ISPath.length,                    filePath.length                ),                slicer = /(\d+)/g,                lastNumGroup,                digits,                results;            if (slicer.test(fullFileName)) {                results = fullFileName.match(slicer);                digits = results[results.length - 1];                numDigits = digits.length;                lastNumGroup = fullFileName.lastIndexOf(digits);                fileBeginning = fullFileName.substring(0, lastNumGroup);                fileEnd = fullFileName.substring(lastNumGroup + digits.length,                        fullFileName.length);                fullName = filePath;                path = ISPath;                /*alert("fullName: " + filePath);*/                /*alert("path: " + path);*/                /*alert("fileBeginning: " + fileBeginning);*/                /*alert("numDigits: " + numDigits);*/                /*alert("fileEnd: " + fileEnd);*/            } else {                throw new Error(localize(error.NON_VALID_SEQUENCE));            }        };        this.getISFileString = function (frameNumber) {            return path +                fileBeginning +                this.getFrameNum(frameNumber) +                fileEnd;        };        this.getFileNameWithPounds = function () {            var poundString = "",                i;            poundString += "[";            for (i = 0; i < numDigits; i += 1) {                poundString += "#";            }            poundString += "]";            return fileBeginning +                poundString +                fileEnd;        };        this.getFrameNum = function (n) {            var numString = String(n),                numLength = numString.length,                i = 0,                numZeros = numDigits - numLength,                addZeros = "";            while (i < numZeros) {                addZeros = addZeros + "0";                i += 1;            }            return addZeros + numString;        };        this.toString = function () {            var me = "";            me += "fullName: " + fullName + "\n";            me += "path: " + path + "\n";            me += "fileBeginning: " + fileBeginning + "\n";            me += "numDigits " + numDigits + "\n";            me += "fileEnd: " + fileEnd + "\n";            return me;        };        this.getPath = function () {            return path;        };        /**         * Deletes files from this image sequence based upon the start and end         * frame numbers sent and if testOnly is false or undefined.         * @param {Int} start The start frame number of the section of the         * sequence to delete. This does not need leading zeroes added to fit         * the number of digits in the sequence name; this is done         * automatically.         * @param {Int} end The end frame number of the section of the sequence         * to delete. This does not need leading zeroes added to fit the number         * of digits in the sequence name; this is done automatically.         * @param {Bool} [testOnly] Whether or not to actually delete the files         * belonging to the defined section of the sequence. Defaults to false.         * @returns {Array} An array with the number of files deleted as the 0         * index and the number of files skipped in the 1 index.         */        this.deleteSequenceSection = function (start, end, testOnly) {            var i = start,                currentFileString,                currentFile,                isTest = testOnly || false,                filesDeleted = 0,                filesSkipped = 0,                currentStatus,                currentTitle,                total = end - start,                progress = 0,                alertText = "";            //Initialize the progress keeper            if (isTest) {                currentTitle = "Simulating Deletion...";                currentStatus = "Simulating Deletion of frames ";            } else {                currentTitle = "Deleting...";                currentStatus = "Deleting frames ";            }            currentStatus += start + " - " + end;            progressKeeper.init(currentStatus, currentTitle);            //Go through the start and end frames and delete them if this is            //not a test.            for (i; i <= end; i += 1) {                currentFileString = this.getISFileString(i);                currentFile = new File(currentFileString);                if (currentFile.exists) {                    //Remove this file if this is not a test.                    if (!isTest) {                        currentFile.remove();                    }                                        filesDeleted += 1;                    progress += 1;                } else {                    filesSkipped += 1;                    progress += 1;                }                                //Update the progress                progressKeeper.updateProgress(total, progress);            }            if (testOnly) {                alertText = localize(lang.wouldHaveDeleted,                        filesDeleted,                        filesSkipped);            } else {                alertText = localize(lang.deleted,                        filesDeleted,                        filesSkipped);            }            progressKeeper.end(alertText);            return true;        };        return this;    };    this.IS = new this.Sequence();    this.RQItemIS = new this.Sequence();// Private Property Definitions://----------------------------------------------------------------------------    that = this;    lang = {        browsePanelTitle: {en: "Image Sequence"},        defaultISLocText: {en: "Browse for the sequence"},        browseButton: {en: "Browse..."},        toolsPanel: {en: "Tools"},        getRQItem: {en: "Get RQ Item Path"},        getWorkArea: {en: "Get Work Area"},        sectionSelPanel: {en: "Section Selection"},        sectionBegin: {en: "Section Begin"},        sectionEnd: {en: "Section End"},        performTest: {en: "Perform Test Only"},        deleteButton: {en: "Perform Delete"},        omNumPrompt: {en: "Enter in the number of the RQ " +            "Item's Output Module:"},        selectIS: {en: "Select the first file of the image sequence:"},        helpButton: {en: "Help"},        rqNumPrompt: {en: "Enter in the number of the Render Queue " +            "Item's Index:"},        deletingSegment: {en: "DELETING SEGMENT:"},        percentComplete: {en: "% COMPLETE:"},        wouldHaveDeleted: {en: "%1 file(s) would have been deleted. " +            "%2 file(s) would have been skipped."},        deleted: {en: "%1 file(s) deleted. %2 file(s) skipped."},        confirmDelete: {en: "Are you sure you want to delete " +            "this sequence section?"},        help: {en: this.scriptName + " " + this.version + " Help\n\n" +            "The point of this application is to allow the user " +            "to easily and quickly delete a selected sequence of " +            "files directly from After Effects. It is most useful " +            "when having to delete only a section of an image sequence " +            "for re-render. Follow the steps below:\n\n" +            "1. Click on Browse and select any file from a file sequence" +            " (such as an Image Sequence). By doing this, you are " +            "telling the application what sequence of files it is " +            "working with.\n" +            "2. Define the boundaries of the section you want to delete " +            "by entering in the numbers of the first and last files " +            "in the sequence in the spaces provided.\n" +            "3. Review your input and then click on \"Perform Delete\". " +            "In the info window, the current percentage of " +            "the process is displayed.\n\nTool Descriptions:\n\n" +            "1. Get RQ Item Path: Allows you to select a render " +            "queue item and have the path that it is set to render " +            "to be used as the image sequence " +            "you are wanting to reference.\n" +            "2. Get Work Area: After making a composition an active " +            "item, this allows you to have the section begin " +            "and section end input fields " +            "set to the in and out time of the work area.\n" +            "3. Perform Test Only: Allows you to see the " +            "results of the opperation " +            "without actually deleting any files.\n" +            "\nImportant Info:\n\n" +            "-This application has some precautionary measures " +            "that prevent bad user input (such as characters " +            "instead of numbers, an ending number less than " +            "the beginning number, skipping files that don't " +            "exist, and selecting files " +            "from a different file sequence than the sequence " +            "given). However, the author of this application can " +            "in no way be held liable for any damage that this script " +            "may cause. Use at your own risk.\n" +            "-As of now, this script can only work with file " +            "sequences that follow the default template that " +            "After Effects creates when defining sequences: " +            "Image_Name_[#####].ext. It does not matter how " +            "many digits there are in the numbering of the files, " +            "but the numbers must be directly after an underscore " +            "(\"_\") and before an extension.\n" +             "-You are asked to verify that you really want " +            "to delete the sequence you've specified. Once you " +            "perform the delete, the files cannot be retrieved " +            "by easy means since the files do not go to the " +            "recycle bin. Use wisely.\n" +            "\nContact Information:\n\n" +            "Contact collin.brooks at gmail.com with " +            "comments/suggestions.\n" +            "**This script can be duplicated and distributed freely " +            "as long as this help text and contact information remain " +            "intact and coupled with this script."}    };    error = {        NON_VALID_RQ_ITEM: {en: "The number you entered is not a valid " +            "render queue item."},        NON_VALID_RQ_SEQUENCE: {en: "It doesn't seem like the path " +            "is a valid sequence."},        NO_ACTIVE_COMP: {en: "Please select the composition whose " +            "work area you would like to get and then retry."},        EMPTY_FRAME_VALUE: {en: "Both the beginning and ending " +            "frames must be set"},        START_FRAME_BGT_STOP: {en: "Ending image number must be " +                "greater than the beginning " +                "image number (%1)"},        FRAMES_NAN: {en: "Frame Values must be numbers!"},        NON_VALID_SEQUENCE: {en: "The selected file does not seem to be" +                " a part of a sequence."}    };// Public Methods://----------------------------------------------------------------------------    this.UI = (function showUI() {        var winGfx,            darkColorBrush,            g, //Local pointer to thePal.grp            res,            l = localize, //Shorthand for localize            /* UI */            thePal = (globalObj instanceof Panel) ?                globalObj :                new Window("palette",                    that.scriptName + " " + that.version,                    undefined,                    {resizeable: false}                    ),            /* Event Listeners */            e = new EventManager();        if (thePal !== null) {            //UI RESOURCE SETUP            res =                "group {orientation: 'column', margins:-8, " +                    "browsePanel: Panel {" +                        "text: '" + l(lang.browsePanelTitle) + "'," +                        "orientation: 'row'," +                        "alignment: ['fill','fill']," +                        "alignChildren: ['fill', 'bottom']," +                        "margins:10," +                        "ISLocation: StaticText {" +                            "size: [220,20]," +                            "text: '" + l(lang.defaultISLocText) + "'" +                        "}," +                        "browseButton: Button {" +                            "text: '" + l(lang.browseButton) + "'," +                        "}" +                    "}," +                    "one: Group {" +                        "orientation: 'row'," +                        "alignment: ['fill', 'fill']," +                        "toolsPanel: Panel {" +                            "text: '" + l(lang.toolsPanel) + "'," +                            "orientation:'column'," +                            "getRQItemPathButton: Button {" +                                "text: '" + l(lang.getRQItem) + "'," +                                "alignment: ['fill','fill']" +                            "}" +                            "getWorkAreaButton: Button {" +                                "text: '" + l(lang.getWorkArea) + "'," +                                "alignment: ['fill', 'fill']" +                            "}" +                        "}," +                        "sectionSelectionPanel: Panel {" +                            "text: '" + l(lang.sectionSelPanel) + "'," +                            "orientation: 'column'," +                            "alignment: ['fill','fill']," +                            "row1: Group {" +                                "orientation:'row'," +                                "alignment: ['fill','fill']," +                                "sectionBeginStaticText: StaticText {" +                                    "text: '" +                                        l(lang.sectionBegin) +                                        "'," +                                    "alignment: ['right', 'middle']" +                                "}," +                                "sectionBegin: EditText {" +                                    "size: [50,20]," +                                    "alignment: ['right', 'middle']" +                                "}," +                            "}," +                            "row2: Group {" +                                "orientation: 'row'," +                                "alignment: ['fill','fill']," +                                "sectionEndStaticText: StaticText {" +                                    "text: '" +                                        l(lang.sectionEnd) +                                    "'," +                                    "alignment: ['right', 'middle']}," +                                "sectionEnd: EditText {" +                                    "size:[50,20]," +                                    "alignment: ['right', 'middle']" +                                "}" +                            "}" +                        "}" +                    "}," +                    "two: Group {" +                        "orientation:'row'," +                        "alignment: ['fill','fill']," +                        "testOnlyCheckbox: Checkbox {" +                            "text: '" + l(lang.performTest) + "'" +                        "}," +                        "buttonGroup: Group {" +                            "orientation: 'row'," +                            "performDeleteButton: Button {" +                                "text: '" +                                    l(lang.deleteButton) +                                "'" +                            "}," +                            "helpButton: Button {" +                                "text: '" + l(lang.helpButton) + "'" +                            "}," +                        "}," +                        "status: StaticText {" +                            "text: ''," +                            "orientation:'row'," +                            "alignment: ['fill', 'fill']" +                        "}" +                    "}" +                "}";            g = thePal.add(res);                        thePal.layout.layout(true);            thePal.onResizing = thePal.onResize = function () {                this.layout.resize();            };            //g.progressBar.visible = false;            //g.status.visible = false;            // Workaround to ensure the edittext text color is black,            // even at darker UI brightness levels            winGfx = thePal.graphics;            darkColorBrush = winGfx.newPen(                winGfx.BrushType.SOLID_COLOR,                [0, 0, 0],                1            );                        /*g.browsePanel.ISLocation.graphics.*/                    /*foregroundColor = darkColorBrush;*/            /*g.one.sectionSelectionPanel.row1.sectionBegin.*/                    /*graphics.foregroundColor = darkColorBrush;*/            /*g.one.sectionSelectionPanel.row2.sectionEnd.*/                    /*graphics.foregroundColor = darkColorBrush;*/                            }        //Assign events to fire        g.browsePanel.browseButton.onClick = e.fire("onBrowse");        g.one.toolsPanel.getRQItemPathButton.onClick =            e.fire("onGetRQItemPath");        g.one.toolsPanel.getWorkAreaButton.onClick =            e.fire("onGetWorkArea");        g.two.buttonGroup.performDeleteButton.onClick =            e.fire("onPerformDelete");        g.two.buttonGroup.helpButton.onClick = e.fire("onHelp");        //Public methods        return {            show: function () {                if (thePal instanceof Window) {                    thePal.center();                    thePal.show();                } else {                    thePal.layout.layout(true);                }            },                                                                        addEventListener: e.addEventListener,            removeEventListener: e.removeEventListener,            setISLocation: function (t) {                g.browsePanel.ISLocation.text = t;            },            setISLocationHelpTip: function (t) {                g.browsePanel.ISLocation.helpTip = t;            },            setStartFrame: function (f) {                g.one.sectionSelectionPanel.row1.                    sectionBegin.text = f;            },            setEndFrame: function (f) {                g.one.sectionSelectionPanel.row2.                    sectionEnd.text = f;            },            getStartFrame: function () {                return g.one.sectionSelectionPanel.row1.sectionBegin.text;            },            getEndFrame: function () {                return g.one.sectionSelectionPanel.row2.sectionEnd.text;            },            testOnly: function () {                return g.two.testOnlyCheckbox.value;            },            updateISLocation: function (path, filename) {                this.setISLocation(filename);                this.setISLocationHelpTip(path);            }        };    }());    this.init = function () {        this.UI.show();    };     // Private Methods://----------------------------------------------------------------------------    /*function displayPercentage(percentage) {*/        /*var increment = 10;*/        /*if (that.currentPercentage !== percentage &&*/                /*percentage % increment === 0) {*/            /*//write(percentage);*/            /*updateStatus(percentage);*/            /*//if (percentage!=100)*/            /*//write(", ");*/            /*//currentPercentage = percentage;*/        /*}*/    /*}*/    /*function updateStatus(t) {*/        /*//thePal.status.text = t;*/    /*}*/    function help() {        alert(localize(lang.help));    }    function browse(fileDialogText, folderLocation) {        return File.openDialog(fileDialogText, folderLocation);    }    /*    function getRQItem() {        var myOutputModNum, myRQItemNum;        //Is there only one render queue item?        if (app.project.renderQueue.numItems === 1) {            //If there is only one render queue item            myRQItemNum = 1;        } else {            //Determin the render queue item to use            myRQItemNum = prompt(localize(lang.rqNumPrompt), "");        }        if (myRQItemNum === null) {            //The user cancelled the dialog. Return false            return false;        } else if (myRQItemNum > app.project.renderQueue.numItems ||                myRQItemNum <= 0) {            //The number entered is not a valid render queue item            alert(localize(error.NON_VALID_RQ_ITEM));            return false;        } else {            //Determine the render queue item based upon the number entered            myRQItemNum = parseInt(myRQItemNum, 10);            that.myRQItem = app.project.renderQueue.item(myRQItemNum);                        if (that.myRQItem.numOutputModules !== 1) {                //There is more than one output module,                 //which one should we use?                myOutputModNum = prompt(localize(lang.omNumPrompt));            } else {                myOutputModNum = 1;            }                        if (myOutputModNum === null || myOutputModNum === "") {                //The user cancelled the promp                return false;            } else {                that.myOutputMod = that.myRQItem.outputModules[                    parseInt(myOutputModNum, 10)                ];                return true;            }        }    }*/    /*function getRQItemPath() {        var extPos, numPos, num, endLocation, sequenceName, relativeLocation,            outputFile;        if (getRQItem() !== false) {            outputFile = File.decode(that.myOutputMod.file.fsName);                        //alert(outputFile);            if (outputFile !== null && outputFile.lastIndexOf("#") !== -1) {                //CHOP OFF NUMBERS AND EXTENSION                extPos = outputFile.lastIndexOf(".");                numPos = outputFile.lastIndexOf("_");                that.myExtension = outputFile.substring(                        extPos, outputFile.length                        );                //alert("My Extension: "+ myExtension);                num = outputFile.substring(numPos + 1, extPos);                that.myDigits = outputFile.match(/#/g).length;                //alert("My Digits: "+ myDigits);                endLocation = outputFile.lastIndexOf(that.myOSSlash);                //alert(endLocation);                sequenceName = File.decode(that.myOutputMod.file.name);                //alert(File.decode(sequenceName));                that.myRelativeLocation = outputFile.substring(                    0,                    endLocation                ) + that.myOSSlash;                that.mySequenceName = sequenceName.substring(                    0,                    sequenceName.length -                        that.myExtension.length -                        that.myDigits - 2                );                //alert("My Sequence Name: "+ mySequenceName);                //alert("My Relative Location: "+ myRelativeLocation);                that.myIS = that.myRelativeLocation + that.mySequenceName;                //alert("My IS: "+ myIS);                updateISLocation(                    that.myRelativeLocation,                    that.mySequenceName,                    that.myDigits,                    that.myExtension                );            } else {                alert(localize(error.NON_VALID_SEQUENCE));            }        }    }*/    function getWorkArea() {        var activeComp = app.project.activeItem,            frameDur,            start,            end;                if (activeComp === null) {            alert(localize(error.NO_ACTIVE_COMP));        } else {            frameDur = activeComp.frameDuration;            start = activeComp.workAreaStart;            end = activeComp.workAreaDuration;                        that.UI.setStartFrame(Math.floor(start / frameDur));            that.UI.setEndFrame(                Math.floor(                    (end / frameDur) +                        (start / frameDur)                ) - 1            );        }    }    function getIS() {        var theFile;        theFile = browse(localize(lang.selectIS));                if (theFile !== null && theFile !== false) {            theFile = File.encode(theFile);            try {                //Slice the file path up and init the IS data.                that.IS.init(theFile);                //CHOP OFF NUMBERS AND EXTENSION                that.UI.updateISLocation(                    that.IS.getPath(),                    that.IS.getFileNameWithPounds()                );            } catch (e) {                alert(e);            }        }    }    function verifyInput(first, last) {        //CHECK TO MAKE SURE BEGINNING AND ENDING NUMBERS ARE OK        if (last < first) {            alert(localize(error.START_FRAME_BGT_STOP, first));            return false;        } else if (isNaN(first) || isNaN(last)) {            alert(localize(error.FRAMES_NAN));            return false;        }                return true;    }    function performDelete() {        var startNum = parseInt(that.UI.getStartFrame(), 10),            endNum = parseInt(that.UI.getEndFrame(), 10),            testOnly = that.UI.testOnly(),            result;        /*clearOutput();*/        /*writeLn(localize(lang.deletingSegment));*/        /*writeLn(localize(lang.percentComplete));*/        /*write("0, ");*/        //CHECK FRAME NUMBERS        if (verifyInput(startNum, endNum)) {            result = that.IS.deleteSequenceSection(startNum, endNum, testOnly);        }    }    function prepareForDelete() {        var testOnly = that.UI.testOnly();        if (testOnly) {            performDelete();        } else {            if (                confirm(                    localize(lang.confirmDelete)                )            ) {                performDelete();            }        }    }// Main://----------------------------------------------------------------------------    //Setup the UI onClick events    this.UI.addEventListener("onBrowse", getIS);    /*this.UI.getRQItemPathFunc(getRQItemPath);*/    this.UI.addEventListener("onGetWorkArea", getWorkArea);    this.UI.addEventListener("onPerformDelete", prepareForDelete);    this.UI.addEventListener("onHelp", help);    return this;}(this));COB.ISSD.init();
