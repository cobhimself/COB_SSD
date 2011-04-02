{
//IMAGE SEQUENCE SEECTION DELETION VERSION 3
//Contact collin.brooks at gmail.com with comments/suggestions.
//This script can be duplicated and distributed freely as long as
//this help text and contact information remain intact and coupled with this script

var myOS = ($.os.indexOf("Mac") !== -1) ? "Mac" : "Win";
var defaultFileLocation = (myOS === "Win") ? "/o/Renders/Ministries/Children/Elevate/" : "/Volumes/Renders$/Ministries/Children/Elevate/";
var myRelativeLocation = ""; //THE LOCATION OF THE IS ONCE IT'S BEEN SELECTED
var mySequenceName = ""; //THE NAME OF THE IMAGE SEQUENCE
var myIS = ""; //THE LOCATION AND NAME OF THE IS WITHOUT NUMBERS OR EXTENSION
var myFirstFrame = null;
var myLastFrame = null;
var myExtension = ""; //THE EXTENSION OF THE IS FILES
var myDigits = 0;
var currentPercentage = 0;
var myRQItem = ""; //THE RENDER QUEUE ITEM OBJECT THE USER HAS SELECTED TO REFERENCE
var myOutputMod = ""; //THE RENDER QUEUE ITEM'S OUTPUT MODULE OBJECT THE USER HAS SELECTED TO REFERENCE


clearOutput();

function help()
{
	helpText = "Image Sequence Section Deletion Help\n\n";
	helpText += "The point of this application is to allow the user to easily and quickly delete a selected sequence of files directly from After Effects. It is most useful when having to delete only a section of an image sequence for re-render. Follow the steps below:\n\n";
	helpText += "1. Click on Browse and select any file from a file sequence (such as an Image Sequence). By doing this, you are telling the application what sequence of files it is working with.\n";
	helpText += "2. Define the boundaries of the section you want to delete by entering in the numbers of the first and last files in the sequence in the spaces provided. Alternatively, you can browse for the files by using the \"Section Begin\" and \"Section End\" buttons.\n";
	helpText += "3. Review your input and then click on \"Perform Delete\". In the info window, the current percentage of the process is displayed.\n";
	helpText += "\nTool Descriptions:\n\n";
	helpText += "1. Get RQ Item Path: Allows you to select a render queue item and have the path that it is set to render to be used as the image sequence you are wanting to reference.\n";
	helpText += "2. Get RQ Item Timespan: Allows you to select a render queue item and have the section begin and section end input fields set to the timespan the render que item you've selected is set to render.\n";
	helpText += "3. Get Work Area: After making a composition an active item, this allows you to have the section begin and section end input fields set to the in and out time of the work area.\n";
	helpText += "4. Get Entire Seq: Scans the image sequence you've browsed for and sets the section begin and section end input fields to encompass the entire image sequence.\n";
	helpText += "5. Perform Test Only: Allows you to see the results of the opperation without actually deleting any files.\n";
	helpText += "\nImportant Info:\n\n";
	helpText += "-This application has some precautionary measures that prevent bad user input (such as characters instead of numbers, an ending number less than the beginning number, skipping files that don't exist, and selecting files from a different file sequence than the sequence given). However, the author of this application can in no way be held liable for any damage that this script may cause. Use at your own risk.\n";
	helpText += "-As of now, this script can only work with file sequences that follow the default template that After Effects creates when defining sequences: Image_Name_[#####].ext. It does not matter how many digits there are in the numbering of the files, but the numbers must be directly after an underscore (\"_\") and before an extension.\n";
	helpText += "-You are asked to verify that you really want to delete the sequence you've specified. Once you perform the delete, the files cannot be retrieved by easy means since the files do not go to the recycle bin. Use wisely.\n";
	helpText += "\nContact Information:\n\n";
	helpText += "Contact collin.brooks at gmail.com with comments/suggestions.\n";
	helpText += "**This script can be duplicated and distributed freely as long as this help text and contact information remain intact and coupled with this script.";
	alert(helpText);
}

function trimZeros(number,digits)
{
	i=0;
	numBeginSpot=0;

	while(number.substring(i,i+1)=="0")
	{
	numBeginSpot++;
	i++;
	}

	if(number.length == numBeginSpot)
	{
		return 0;
	}else{
		return parseInt(number.substring(numBeginSpot,number.length));
	}
}

function returnFrameNum(number, digits)
{
	numString = number +"";
	numLength = numString.length;
	i=0;
	numZeros = digits-numLength
	addZeros = "";
	while(i<numZeros)
	{
		addZeros = addZeros + "0";
		i++;
	}
	return addZeros+numString;
}

function browse(fileDialogText, folderLocation, limitSelection)
{
//RECIEVE USER INPUT FROM THEIR SELECTION OF A FILE
	if(limitSelection)
	{
		selectFiles = "Text Files:*"+myExtension;
	}else{
		selectFiles = "All Files:*";
	}
	var browsedFile = File.openDialog(fileDialogText,folderLocation);
	return browsedFile;
}

function getRQItem()
{
	var myOutputModNum;
	if(app.project.renderQueue.numItems == 1)
	{
		myRQItemNum = 1;
	}else{
		myRQItemNum = prompt("Enter in the number of the Render Queue Item's Index:", "");
	}
	
	if(myRQItemNum == null)
	{
		return false;
	}else if(myRQItemNum > app.project.renderQueue.numItems || myRQItemNum <= 0){
		alert("The number you entered is not a valid render queue item.");
		return false;
	}else{
		myRQItemNum = parseInt(myRQItemNum);
		myRQItem = app.project.renderQueue.item(myRQItemNum);
		
		if(myRQItem.numOutputModules != 1)
		{
			myOutputModNum = parseInt(prompt("Enter in the number of the RQ Item's Output Module:", ""));
		}else{
			myOutputModNum = 1;
		}
	myOutputMod = myRQItem.outputModules[myOutputModNum];
	return true;
	}
}

function getRQItemPath()
{
	if(getRQItem())
	{
		outputFile = File.decode(myOutputMod.file.fsName);
		
		//alert(outputFile);
		if(outputFile != null && outputFile.lastIndexOf("#") != -1)
		{
			//CHOP OFF NUMBERS AND EXTENSION
			var extPos = outputFile.lastIndexOf(".");
			var numPos = outputFile.lastIndexOf("_");
			myExtension= outputFile.substring(extPos,outputFile.length);
			alert("My Extension: "+ myExtension);
			var num=outputFile.substring(numPos+1,extPos);
			myDigits = outputFile.match(/#/g).length;
			alert("My Digits: "+ myDigits);
			var endLocation = outputFile.lastIndexOf("\\");
			alert(endLocation);
			var sequenceName = File.decode(myOutputMod.file.name);
			alert(File.decode(sequenceName));
			var relativeLocation = outputFile.substring(0,endLocation)+"\\";
			mySequenceName = sequenceName.substring(0,sequenceName.length-myExtension.length-myDigits-2);
			alert("My Sequence Name: "+ mySequenceName);
			myRelativeLocation = relativeLocation;
			alert("My Relative Location: "+ myRelativeLocation);
			myIS = myRelativeLocation+mySequenceName;
			alert("My IS: "+ myIS);
			ISLocation.text = myIS;
		}else{
			alert("It doesn't seem like the path is a valid sequence.");
		}
	}
}

function getMultLayerTimespans()
{
	var starts = new Array();
	var ends = new Array(0);
	//GET THE SELECTED LAYER'S DURATIONS
	var theProj = app.project;
	var theComp = theProj.activeItem;
	if(theComp.selectedLayers != null)
	{
		var selectedLayers = theComp.selectedLayers;
		var frameDur = theComp.frameDuration;
	}else{
		alert("You must have at least one layer selected");
	}

	for(i=0;i<selectedLayers.length; i++)
	{
		//GET IN POINT AND OUT POINT AND PREPARE ARRAY TO SEND TO DELETE
		starts[i] = Math.floor(selectedLayers[i].inPoint/frameDur);
		ends[i] = Math.floor(selectedLayers[i].outPoint/frameDur)-1;
		alert(starts[i]+" - "+ends[i]);
	}
		prepareForDelete("mult", starts, ends);
}

function getWorkArea()
{
	var activeComp = app.project.activeItem;
	
	if(activeComp == null)
	{
		alert("Please select the composition whose work area you would like to get and then retry");
	}else{
		var frameDur = activeComp.frameDuration;
		var start = activeComp.workAreaStart;
		var end = activeComp.workAreaDuration;
		
		firstFrame.text = Math.floor(start/frameDur);
		lastFrame.text = Math.floor((end/frameDur)+(start/frameDur))-1;
	}
}

function getEntireSeq()
{
	if(myRelativeLocation == "")
	{
		alert("You have not set an image sequence. Please browse for it and then retry.");
	}else{
		var theFolder = Folder(myRelativeLocation);
		//GET THE LIST OF FILES THAT HAVE THE RIGHT EXTENSION
		writeLn("Aquiring file list");
		var theList = theFolder.getFiles("*"+myExtension);
		var firstImage = theList[0].name;
		var lastImage = theList[theList.length-1].name;
		writeLn("Done");
		
		var extPos = firstImage.lastIndexOf(".");
		var numPos = firstImage.lastIndexOf("_");
		firstFrame.text = trimZeros(firstImage.substring(numPos+1,extPos));
		
		extPos = lastImage.lastIndexOf(".");
		numPos = lastImage.lastIndexOf("_");
		lastFrame.text = trimZeros(lastImage.substring(numPos+1,extPos));
	}
}

function getIS()
{
	
	var theFile = browse("Select First File Of Image Sequence", defaultFileLocation, false);
	
	if(theFile != null && theFile != false)
	{
		theFile = File.encode(theFile);
		//CHOP OFF NUMBERS AND EXTENSION
		var extPos = theFile.lastIndexOf(".");
		var numPos = theFile.lastIndexOf("_");
		myExtension=theFile.substring(extPos,theFile.length);
		var num=theFile.substring(numPos+1,extPos);
		myDigits = num.length;
		var endLocation = theFile.lastIndexOf("/");
		var sequenceName = theFile.substring(endLocation+1,theFile.length-(myExtension.length+myDigits));
		var relativeLocation = Folder(theFile.substring(0,endLocation)).fsName+"\\";
		mySequenceName = sequenceName;
		myRelativeLocation = relativeLocation;
		myIS = relativeLocation+sequenceName;
		ISLocation.text = myIS;
	}
}

function getFirstFrame()
{
	myFirstFrame = getFrame("First");
	if(myFirstFrame != null)
	{	
		firstFrame.text = myFirstFrame;
	}
}

function getLastFrame()
{
		myLastFrame = getFrame("Last");
	if(myLastFrame != null)
	{	
		lastFrame.text = myLastFrame;
	}
}

function getFrame(frameSide)
{
	//CHECK TO SEE IF myIS HAS BEEN ESTABLISHED
	if(myIS != "")
	{
		do
		{
			var theFile = File.encode(browse("Select The "+frameSide+" Frame Of The Section You Want To Delete", defaultFileLocation, false));
			//IMAGE SEQUENCE SECTION DELETE
			var extPos = theFile.lastIndexOf(".");
			var numPos = theFile.lastIndexOf("_");
			var ext=theFile.substring(extPos,theFile.length);
			var num=theFile.substring(numPos+1,extPos);
			var digits = num.length;
			var endLocation = theFile.lastIndexOf("/");
			var sequenceName = theFile.substring(endLocation+1,theFile.length-(ext.length+digits));
				sequenceName = sequenceName.replace(/520/g, "%2 "); //520 stand for space?
			var relativeLocation = Folder(theFile.substring(0,endLocation)).fsName+"\\";
			var theNum = trimZeros(num,digits);
		}while((!verifyFileInput(theFile,frameSide, ext, digits, sequenceName, relativeLocation, theNum))); 
			alert("Num: "+num+". Digits: "+digits+". Sequence Name: "+sequenceName);
		if(theFile == "null")
		{
			return null;
		}else{
			return theNum;
		}
	}else{
		alert("Please select the image sequence before assigning the section boundaries");
		return false;
	}
}

function verifyFileInput(passedFile, theSide, ext, digits, sequenceName, relativeLocation, theNum)
{
var errorString = "";
	if(passedFile != "null")
	{
		if(ext != myExtension)
			errorString += "The extension of your selection does not match the extension of the image sequence you have selected.\n";
		if(digits != myDigits)
			errorString += "The frame number of your selection does not match the number of digits your image sequence has.\n";
		if(sequenceName != mySequenceName || relativeLocation != myRelativeLocation)
			errorString += "The file you have selected is not a part of your main image sequence.\n";
		if(theSide == "First")
		{
			if(myLastFrame != null && theNum > myLastFrame)
				errorString += "The beginning frame you have selected is greater than your ending frame.\n";
		}else{
			if(myFirstFrame != null && theNum < myFirstFrame)
				errorString += "The ending frame you have selected is less than your beginning frame.\n";
		}
	}
	
	if(errorString == "")
	{
		return true;
	}else{
		alert(errorString);
		return false;
	}
}

function verifyInput(deleteType, first,last)
{
	var error = "";
	if(ISLocation.text.value == null) { error += "Please enter in an image sequence location!\n" }
	
	if(deleteType == "single")
	{
		//CHECK TO MAKE SURE BEGINNING AND ENDING NUMBERS ARE OK
		if(last < first)
		{
			error += "Ending image number must be greater than the beginning image number ("+first+")";
		}else if(isNaN(first) || isNaN(last)){
			error += "Values must be numbers!";
		}
	}
	
	if(error != "") { alert(error); return false; }else{ return true; }
}

function displayPercentage(percentage)
{
var increment = 10;
	if(currentPercentage != percentage && percentage%increment == 0)
	{
	write(percentage);
		if(percentage!=100)
			write(", ");
	currentPercentage = percentage;
	}
}

function prepareForDelete(deleteType, startNum, endNum)
{
	var okToGo = true;
		if(testOnly.value)
		{
			okToGo = true;
		}else if(startNum.length == 0){
			alert("Please select some layers!");
			okToGo = false;
		}else{
			if(confirm("Are you sure you want to delete this sequence section?"))
			{
				okToGo = true;
			}else{
				okToGo = false;
			}
		}

	if(okToGo)
	{
		if(deleteType == "mult")
		{
			if(verifyInput(deleteType, startNum, endNum))
			{
				for(z=0;z<startNum.length;z++)
				{
					deleteResult = performDelete(deleteType,startNum[z],endNum[z]);
					currentDeletedFile += deleteResult[0];
					currentSkippedFile += deleteResult[1];
					alert(" StartNum[z]: " +startNum[z]+"   End Num[Z]: " +endNum[z]); 
					alert(currentDeletedFile + ", " + currentSkippedFile);
				}
			}
		}else if(deleteType == "single"){
			//CHECK FRAME NUMBERS
			if(verifyInput(deleteType, startNum,endNum))
			{
				deleteResult = performDelete(deleteType, startNum, endNum);
				currendDeletedFile = deleteResult[0];
				currentSkippedFile = deletedResult[1];
			}
		}
		
		if(testOnly.value)
		{
		alertText = currentDeletedFile+" file(s) would have been deleted. "+currentSkippedFile+" files(s) would have been skipped.";
		}else{
		alertText = currentDeletedFile+" file(s) deleted. "+currentSkippedFile+" files(s) skipped.";
		}
		
		alert(alertText);
	}
}

function performDelete(deleteType, startNum, endNum)
{
clearOutput();
writeLn("DELETING SEGMENT:");
writeLn("% COMPLETE:");
write("0, ");
currentPercentage = 0;
filesSkipped = new Array();
filesDeleted = new Array();
currentSkippedFile = 0;
currentDeletedFile = 0;
percentage = 0;

//BUILD SEQUENCE ARRAY
sequence = new Array();
currentNum = 0;

	for(f=startNum;f<=endNum;f++)
	{
	currentSequenceNum = returnFrameNum(f,myDigits);
	sequence[currentNum] = mySequenceName+currentSequenceNum+myExtension;
	currentNum++;
	}

	for(f=0;f<sequence.length;f++)
	{
	percentage = Math.round(((f+1)/sequence.length)*100);
	displayPercentage(percentage);
	currentFile = File(myRelativeLocation+sequence[f]);
		//DECIDE WHETHER OR NOT TO SKIP OR DELETE
		if(currentFile.exists)
		{
			if(!testOnly.value)
			{
			currentFile.remove();
			}
			filesDeleted[currentDeletedFile]=sequence[f];
			currentDeletedFile++;
		}else{
		filesSkipped[currentSkippedFile]=sequence[f];
		currentSkippedFile++;
		}
	}
	return new Array(currentDeletedFile, currentSkippedFile);	
}



var ISDialog = function(thisObj){

	//Window/Panel setup
	var myWindow = (thisObj instanceof Panel) ? thisObj : new Window("palette", "COB - Image Sequence Section Deletion", undefined, {resizeable:true});

	//Add the resources for this window

	try{
	var res = "group { orientation: 'column', margins:0, alignment:['fill','fill'], \
        ISPanel: Panel { text: 'Section Selection'}, \\n\\n\
		},\
		sectionSelectionPanel: Panel { text: 'Section Selection'},\\n\
		},\
	}";
	myWindow.grp = myWindow.add(res);
	}catch(e){
		throw("UI Resource Error thrown: " + COB.UI.resError(e.toString(), res));
		COB.log.write("UI Resource Error thrown: " + COB.UI.resError(e.toString(), res));
	}

}();

ISDialog(this);


/************************/



ISdlg = new Window("palette", "Image Sequence Section Deletion");
ISdlg.bounds = [230,25,584,225];
ISPanel = ISdlg.add("panel", [7.5,3.2,345,48],"Image Sequence" );
sectionSelectionPanel = ISdlg.add("panel", [145.5,49.6,345,120],"Section Selection" );
toolsPanel = ISdlg.add("panel", [9,49.6,142.5,195.2],"Tools" );
browseButton = ISPanel.add("button", [6,14.4,70.5,36.8],"Browse" );

ISLocation = ISPanel.add("edittext", [75,14.4,333,36.8],"");
getRQItemPathButton = toolsPanel.add("button", [6,14.4,129,36.8],"Get RQ Item Path" );

getMultLayerTimes = toolsPanel.add("button", [6,40,129,62.4],"Delete From Layer Times" );

getWorkAreaButton = toolsPanel.add("button", [4.5,67.2,129,89.6],"Get Work Area" );

getEntireSeqButton = toolsPanel.add("button", [4.5,94.4,129,116.8],"Get Entire Seq" );

testOnly = toolsPanel.add("checkbox", [13.5,118.4,127.5,140.8],"Perform Test Only" );

beginSectionButton = sectionSelectionPanel.add("button", [6,14.4,90,36.8],"Section Begin" );

endSectionButton = sectionSelectionPanel.add("button", [6,40,90,62.4],"Section End" );

firstFrame = sectionSelectionPanel.add("edittext", [93,14.4,193.5,36.8],"" );
lastFrame = sectionSelectionPanel.add("edittext", [93,40,193.5,62.4],"" );
deleteButton = ISdlg.add("button", [160.5,134.4,318,156.8],"Perform Delete" );

cancelButton = ISdlg.add("button", [246,171.2,295.5,193.6],"Cancel" );
helpButton = ISdlg.add("button", [187.5,171.2,237,193.6],"Help" );

browseButton.onClick = getIS;
getRQItemPathButton.onClick = getRQItemPath;
getMultLayerTimes.onClick = getMultLayerTimespans;
getWorkAreaButton.onClick = getWorkArea;
getEntireSeqButton.onClick = getEntireSeq;
beginSectionButton.onClick = getFirstFrame;
endSectionButton.onClick = getLastFrame;
deleteButton.onClick = function () { prepareForDelete("single", parseInt(firstFrame.text), parseInt(lastFrame.text)); }
cancelButton.onClick = function () { ISdlg.close() };
helpButton.onClick = help;


ISdlg.center();
ISdlg.show();
}
