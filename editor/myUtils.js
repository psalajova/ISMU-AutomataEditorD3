var TEST_GRAPH1 = "init=s1 (s1,a)=s2 (s1,b)=s2 (s2,c)=s3 (s2,d)=s3 (s3,\"pepepe\")=s1 (s3,i)=s3 (s3,j)=s3 (s2,E)=s4 (s1,E)=s4 (s3,E)=s4 final{s2,s3} ##states@s1;100;100;1;0@s2;259;362;0;1@s3;443;105;0;1@s4;261;206;0;0@s1;s2;a,b;-60;83;0.00@s2;s3;c,d;46;48;0.00@s3;s1;\"pepepe\";0;0;0.00@s3;s3;i,j;0;0;-0.35@s2;s4;E;0;0;0.00@s1;s4;E;0;0;0.00@s3;s4;E;0;0;0.00";
var TEST_DFA1 = "init=s1 (s1,\"dd\")=s2 (s1,a)=s3 (s1,v)=s3 (s3,\"dd\")=s2 (s3,a)=s2 (s3,b)=s2 (s3,\"back\")=s1 (s2,c)=s2 (s2,p)=s1 final={s2} ##states@s1;100;100;1;0@s2;346;102;0;1@s3;243;300;0;0edges@s1;s2;\"dd\";8;-58;0.00@s1;s3;a,v;-61;72;0.00@s3;s2;\"dd\",a,b;83;32;0.00@s3;s1;\"back\";0;0;0.00@s2;s2;c;0;0;1.47@s2;s1;p;0;0;0.00";
var TEST_GRAPH_EFA = "init=s2 (s1,\e)={s2,s3} (s2,a)={s3} (s2,b)={s3,s1} (s1,a)={s4} (s1,b)={s4} (s4,\"string\")={s3} (s3,b)={s2} (s3,\"string\")={s4} (s3,\e)={s4,PEKLO} (s4,a)={s4} (s4,b)={s4} (s4,c)={s4} (PEKLO,\"peklo\")={s3} final={s1,s3,s4,PEKLO}##states##@s1;100;100;0;1@s2;101;388;1;0@s3;288;264;0;1@s4;504;100;0;1@PEKLO;458;419;0;1##edges##@s1;s2;ε;-80;10;0.00@s2;s3;a,b;35;68;0.00@s1;s3;ε;0;0;0.00@s1;s4;a,b;0;0;0.00@s4;s3;\"string\";40;86;0.00@s2;s1;b;0;0;0.00@s3;s2;b;0;0;0.00@s3;s4;\"string\",ε;-32;-18;0.00@s4;s4;a,b,c;0;0;-0.27@s3;PEKLO;ε;-32;43;0.00@PEKLO;s3;\"peklo\";32;-25;0.00";

function getTextArea(questionId, ext) {
	var txaName = "XXX", qSpan;

	var questionSpans = document.getElementsByClassName("odpo_otazka_telo");
	
	for (var i = 0; i < questionSpans.length; i++) {
		const span = questionSpans[i];
		if (span.getElementById(questionId) != null ) {
			qSpan = span;
			break;
		}
	}

	if (qSpan != null) {
		for (var e in qSpan) {
			if (e.getAttribute("name") == "test_sklad" && e.nodeName.toLower() == "input") {
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



/* -FUNCTION--------------------------------------------------------------------
	Author:			Radim Cebis, modified by Patricia Salajova
	Function:		register(id, func)
	Param elem:		element (textArea)
	Usage:			registers func to element with correct question ID
----------------------------------------------------------------------------- */ 	
function register(id, func, elem)
{	
	// when we are in inspection mode, we do not want the syntax check to work
	if(jeProhlizeciStranka()) {
		if (document.getElementById(id + "-error"))
        	document.getElementById(id + "-error").setAttribute("hidden", '');
        return;
    }
	
	function test(evt)
	{		
		if (!evt) var evt = window.event;		
		var input = (evt.target) ? evt.target : evt.srcElement;
		
		var result = func(input.value);
		if(elem.value == "") 
	    {
	      document.getElementById(id + "-error").className = "alert alert-info";
		  document.getElementById(id + "-i").className = "";
	      document.getElementById(id + "-error-text").innerHTML = "Zde se zobrazuje nápověda syntaxe.";
	    }
		else
		{
	  		if(result.error_string != "")
	  			document.getElementById(id + "-error-text").innerHTML = htmlentities(result.error_string);
	  		else 
	  			document.getElementById(id + "-error-text").innerHTML = "Syntax je korektní.";
	  		
	  		if (result.error == 2) {
	  			document.getElementById(id + "-error").className = "alert alert-danger";
				document.getElementById(id + "-i").className = "glyphicon glyphicon-remove";
	  		}
	  		else if(result.error == 1){
	  			document.getElementById(id + "-error").className = "alert alert-warning";
				document.getElementById(id + "-i").className = "glyphicon glyphicon-warning-sign";
	  		}
	  		else {
	  			document.getElementById(id + "-error").className = "alert alert-success";
				document.getElementById(id + "-i").className = "glyphicon glyphicon-ok";
	  		}
		}
	}	
	addEvent(elem,'change',test);
	addEvent(elem,'keyup',test);	
	addEvent(elem,'focus',test);
	addEvent(elem,'blur',test);	
	addEvent(elem,'mouseup',test);	
	elem.focus();
	elem.blur();
	scroll(0,0);
}