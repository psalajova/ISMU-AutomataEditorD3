var TEST_GRAPH1 = "init=s1 (s1,a)=s2 (s1,b)=s2 (s2,c)=s3 (s2,d)=s3 (s3,\"pepepe\")=s1 (s3,i)=s3 (s3,j)=s3 (s2,E)=s4 (s1,E)=s4 (s3,E)=s4 final{s2,s3} ##states@s1;100;100;1;0@s2;259;362;0;1@s3;443;105;0;1@s4;261;206;0;0@s1;s2;a,b;-60;83;0.00@s2;s3;c,d;46;48;0.00@s3;s1;\"pepepe\";0;0;0.00@s3;s3;i,j;0;0;-0.35@s2;s4;E;0;0;0.00@s1;s4;E;0;0;0.00@s3;s4;E;0;0;0.00";
var TEST_DFA1 = "init=s1 (s1,\"dd\")=s2 (s1,a)=s3 (s1,v)=s3 (s3,\"dd\")=s2 (s3,a)=s2 (s3,b)=s2 (s3,\"back\")=s1 (s2,c)=s2 (s2,p)=s1 final={s2} ##states@s1;100;100;1;0@s2;346;102;0;1@s3;243;300;0;0edges@s1;s2;\"dd\";8;-58;0.00@s1;s3;a,v;-61;72;0.00@s3;s2;\"dd\",a,b;83;32;0.00@s3;s1;\"back\";0;0;0.00@s2;s2;c;0;0;1.47@s2;s1;p;0;0;0.00";
var TEST_GRAPH_EFA = "init=s2 (s1,\e)={s2,s3} (s2,a)={s3} (s2,b)={s3,s1} (s1,a)={s4} (s1,b)={s4} (s4,\"string\")={s3} (s3,b)={s2} (s3,\"string\")={s4} (s3,\e)={s4,PEKLO} (s4,a)={s4} (s4,b)={s4} (s4,c)={s4} (PEKLO,\"peklo\")={s3} final={s1,s3,s4,PEKLO}##states##@s1;100;100;0;1@s2;101;388;1;0@s3;288;264;0;1@s4;504;100;0;1@PEKLO;458;419;0;1##edges##@s1;s2;ε;-80;10;0.00@s2;s3;a,b;35;68;0.00@s1;s3;ε;0;0;0.00@s1;s4;a,b;0;0;0.00@s4;s3;\"string\";40;86;0.00@s2;s1;b;0;0;0.00@s3;s2;b;0;0;0.00@s3;s4;\"string\",ε;-32;-18;0.00@s4;s4;a,b,c;0;0;-0.27@s3;PEKLO;ε;-32;43;0.00@PEKLO;s3;\"peklo\";32;-25;0.00";

//unused
function getTextArea(questionId, ext) {
	var txaName = "XXX", qSpan;

	var questionSpans = document.getElementsByClassName("odpo_otazka_telo");
	for (var i = 0; i < questionSpans.length; i++) {
		const span = questionSpans[i];
		if ($(span).find("#" + questionId).length > 0) {
			qSpan = span;
			break;
		}
	}
	if (qSpan != null) {
		for (var i = 0; i < qSpan.children.length; i++) {
			var e = qSpan.children[i];
			if (e.getAttribute("name") === "test_sklad" && e.nodeName.toLowerCase() == "input") {
				txaName = e.getAttribute("value") + ext;
			}
		}
	}

	var result = document.getElementsByName(txaName);

	if (qSpan == null || result == null) {
		alert("textArea " + questionId + " " + txaName + " nenalezena!!!");
		return null;
	}
	if (result.length != 1) {
		alert("textArea " + questionId + " " + txaName + " nejednoznacna!!! results=" + result.length);
	}

	return result[0];
}

var editor_init, upload;

if (typeof editor_init !== 'function') {
	var url = 'https://hesperia.fi.muni.cz/hint', otazky = {};

	var onl = window.onload || function () { }; // prev onload
	window.onload = function () {
		onl();
		var textareas = document.getElementsByTagName('textarea');
		for (var n in otazky) {
			// cilova textarea je n-ta v poradi
			// n 		 - index otazky
			// otazky[n] - id
			var txa = textareas[n];

			if (otazky[n] != null) {
				var div = document.getElementById(otazky[n]);
                txa.parentNode.insertBefore(div, txa.nextSibling);
				initialise(otazky[n], txa);          
			}
		}
	}

	editor_init = function (id) {
		// v okamziku volani funkce nase textarea jeste neexistuje, ale bude to hned ta nejblizsi
		otazky[document.getElementsByTagName('textarea').length] = id;
	};

	upload = function () { editor_init(null); };
}

/*  example text qdefx file 16.2.2021

    ++<noscript>(Nemáte zapnutý JavaScript, ale pro správnou funkci otázky je nutný JavaScript. Jako prohlížeč je doporučený Firefox.) </noscript>
    <script src="https://ajax.googleapis.com/ajax/libs/d3js/6.2.0/d3.min.js"></script>
    <script src="//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/jquery-ui.js"></script>
    <style type="text/css">@import "//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/jquery-ui.css";</style>
    <script src="//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/editor2.js"></script>
    <script src="//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/editorUtils.js"></script>
    <style type="text/css">@import "//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/editorStyle.css";</style>
    <script src="//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/utilIS.js" type="text/javascript"></script>
    <script src="//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/DFAParser.js" type="text/javascript"></script>
   <script src="//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/GRAParser.js" type="text/javascript"></script>
    <script>

setupLanguage();

var editor_init, upload;

if (typeof editor_init !== 'function') {
	var url = 'https://hesperia.fi.muni.cz/hint', otazky = {};

	var onl = window.onload || function () { }; // prev onload
	window.onload = function () {
		onl();
		var textAreas = document.getElementsByTagName('textarea');
		for (var n in otazky) {
			// cilova textarea je n-ta v poradi
			
			var txa = textAreas[n];
			
			// n 		 - index otazky
			// otazky[n] - id

			if (otazky[n] != null) {
				var div = document.getElementById(otazky[n]);
                                txa.parentNode.insertBefore(div, txa.nextSibling);
				initialise(otazky[n], txa);
                                
			}
		}
	}

	editor_init = function (id) {
		// v okamziku volani funkce nase textarea jeste neexistuje, ale bude to hned ta nejblizsi
		otazky[document.getElementsByTagName('textarea').length] = id;
	};
	upload = function () { editor_init(null); };
}
</script>
<span id="ruler">
--
</span><div id="q1" data-type="DFA"></div><script>editor_init("q1");</script>Napište deterministický konečný automat popisující následující jazyk nad abecedou <m>\Sigma = \{a,b,c\}</m>:<br/><br/><m>L = \{ab\}^*. \{c\} . \{ab\}^*</m>
 :e1a________________________________________________________________________________  
:e1a="d:?DFA-DFA:(A,a)=B final={B}" ok
--
<div id="q2" data-type="DFA"></div><script>editor_init("q2");</script>Napište deterministický konečný automat popisující následující jazyk nad abecedou <m>\Sigma = \{a,b,c\}</m>:<br/><br/><m>L = \{ab\}^* . \{c\} . \{ba\}^*</m>
 :e1a________________________________________________________________________________  
:e1a="d:?DFA-DFA:(A,a)=B(A,b)=C(A,c)=D(B,a)=C(B,b)=A(B,c)=C(C,a)=C(C,b)=C(C,c)=C(D,a)=C(D,b)=E(D,c)=C(E,a)=D(E,b)=C(E,c)=C final={D}" ok
--
<div id="q3" data-type="GRA"></div><script>editor_init("q3");</script>::Testovací otázka::Zadání
 :e______________
:e="d:foo" ok
--
++
<script type="text/javascript">
	//var jQuery_new = $;
	//$ = jQuery = jQuery_old;
</script> */


function insertArrows(table, row, index) {
	var cell = insertCell(row, index, ["arrow-td"], "40px");
	
	var initArr = document.createElement("div");
	$(initArr).prop("class", "top-arrow base-arrow");
	$(initArr).prop("title", tableInitialButtonName);
	initArr.innerHTML = initSymbol;
	
	
	var accArr = document.createElement("div");
	$(accArr).prop("class", "bottom-arrow base-arrow");
	$(accArr).prop("title", tableAcceptingButtonName);
	accArr.innerHTML = accSymbol;

	if (!jeProhlizeciStranka_new()) {
		$(initArr).click(() => setInitDiv(table, initArr));
		$(accArr).click(() => toggleAccArrow(accArr));
	}

	cell.initArrow = initArr;
	cell.accArrow = accArr;

	cell.appendChild(initArr);
	cell.appendChild(accArr);

	return cell;
}

function setInitDiv(table, div) {
	if (!table.locked) {
        deselectCell(table);
    }

	if (table.selectedInitDiv == div) {
		unselectInitDiv(table);
		setInitStateAsNotInitial(table.questionDiv);
		return;
	}
	if (table.selectedInitDiv != null) {
		unselectInitDiv(table);
	}
	$(div).addClass("selected-arrow");
	table.selectedInitDiv = div;

	//edit state in graph
	var stateId = table.rows[div.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;
	var data = getStateDataById(table.questionDiv, stateId);
	setNewStateAsInitial(table.questionDiv, data);
}

function unselectInitDiv(table) {
	$(table.selectedInitDiv).removeClass("selected-arrow");
	table.selectedInitDiv = null;
}


function toggleAccArrow(div) {
	var table = findParentWithClass(div, tableClasses.myTable);
	if (!table.locked) {
        deselectCell(table);
    }
	$(div).toggleClass("selected-arrow");
	
	var stateId = table.rows[div.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;

	//edit state in graph
	var stateG = getStateGroupById(table.questionDiv, stateId);
	toggleAcceptingState(table.questionDiv, stateG.datum(), stateG);
}