var totalFiles = 500,
	i,
	fileBegin = "Comp\\ 1_3_",
	fileEnd = ".tif",
	numDigits = 5,
    theCmd;
	
function digitize (n) {
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


for (i = 0; i < totalFiles; i += 1)
{
	theCmd = 'touch ~/Desktop/delete/' + fileBegin +
		digitize(i) + fileEnd + '';
	system.callSystem(theCmd);
}
