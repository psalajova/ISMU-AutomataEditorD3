// HTML ELEMENTS UTILS
function hideElem(element) {
  element.style.display = "none";
}

function showElem(element, inline = false) {
  if (inline) {
    element.style.display = "inline-block";
  }
  else {
    element.style.display = "block";
  }
}

function clickGraph(questionDiv) {
  if (questionDiv.lastEdited == "graph") {
    deselectAll();
    return;
  }
  //prejst vsetky stavy 
  //a ak stav nie je inicialny && nie je akceptujuci && nema ziadne prechody z neho aj do neho tak vymazat
  hideElem(questionDiv.textArea);
  hideElem(questionDiv.tableDiv);
  //generateGraphFromText()??;

  if (questionDiv.lastEdited == "text") {
    //updateDataFromText(questionDiv);
    mergeEdges(questionDiv);
  }
  //updateGraph(questionDiv);
  showElem(questionDiv.graphDiv);
  showElem(questionDiv.hintDiv);
  questionDiv.lastEdited = "graph"
}

function clickTable(questionDiv) {
  if (questionDiv.lastEdited == "graph") {
    updateSvgDimensions(questionDiv);
    deselectAll();
  }
  if (questionDiv.lastEdited == "table") {
    return;
  }
  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  hideElem(questionDiv.textArea);
  if (questionDiv.lastEdited == "text") {
    //updateDataFromText(questionDiv);
  }
  disableControlButtons(questionDiv.tableDiv);
  createTableFromData(questionDiv);
  showElem(questionDiv.tableDiv);
  questionDiv.lastEdited = "table";
}

function clickText(questionDiv) {
  if (questionDiv.lastEdited == "graph") {
    deselectAll();
  }

  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  hideElem(questionDiv.tableDiv);

  generateTextFromData(questionDiv);
  showElem(questionDiv.textArea);
  questionDiv.lastEdited = "text";
}

function clickHintButton(questionDiv) {
  var hintContentDiv = questionDiv.hintDiv.contentDiv;
  //hintContentDiv.classList.toggle("slide-Active");
  if (hintContentDiv.style.display == "none") {
    showElem(hintContentDiv, true);
    questionDiv.hintDiv.hintButton.innerText = hintLabel + " 🡡";
  }
  else {
    hideElem(hintContentDiv);
    questionDiv.hintDiv.hintButton.innerText = hintLabel + " 🡣";
  }
}

function setupHints(div) {
  for (const property in hints) {
    div.appendChild(createParagraph(hints[property]));
  }
}

function createParagraph(string) {
  var p = document.createElement("P");
  p.setAttribute("class", "hint-paragraph");
  p.innerHTML = string;
  return p;
}

function createToolboxButton(g, x, y, src) {
  return g.append("svg:image")
    .attr("x", x)
    .attr("y", y)
    .attr("href", src)
    .attr("width", 35)
    .attr("height", 37)
    .attr("class", "toolbox-button")
    ;
}

function printData(collection) {
  collection.forEach(function (dataItem) {
    console.log(dataItem);
  });
}