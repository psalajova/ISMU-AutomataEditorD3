/* --------------------------------------------------------------------------
File:	utilIS.js
Author:	Radim Cebis
Usage:	functions for assigning the parser to element's events

You may use, modify and distribute this software under the terms and conditions
of the Artistic License. Please see ARTISTIC for more information.
----------------------------------------------------------------------------- */

/* -FUNCTION--------------------------------------------------------------------
	Function:		addEvent(obj, evType, fn)
		
	Usage:			adds event listener (fn) to the object (obj) on event (evType)
----------------------------------------------------------------------------- */ 	
function addEvent(obj, evType, fn){ 
 if (obj.addEventListener){ 
   obj.addEventListener(evType, fn, false); 
   return true; 
 } else if (obj.attachEvent){ 
   var r = obj.attachEvent("on"+evType, fn); 
   return r; 
 } else { 
   return false; 
 } 
}

/* -FUNCTION--------------------------------------------------------------------
	Function:		register(id, func)
	Param elemType: type of the answer element ( "text" - :t, "area" - :a) otherwise :e is used
	Usage:			registers func to element with correct question ID
----------------------------------------------------------------------------- */ 	
function register(id, func, elemType)
{
	
	// when we are in inspection mode, we do not want the syntax check to work
	if(jeProhlizeciStranka_new()) {
		if (document.getElementById(id + "-error"))
        	document.getElementById(id + "-error").setAttribute("hidden", '');
        return;
    }
	//console.log("registering");
	var elem;
	if(elemType == "area") elem = vysledkovePole(id, "_a_a_1");
	else if(elemType == "text") elem = vysledkovePole(id, "_t_a_1");
	else elem = vysledkovePole(id, "_e_a_1");
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

function registerColorHighlighting(idTextarea, func, elem) {
    function test(evt) {
        if (!evt) var evt = window.event;
        var input = (evt.target) ? evt.target : evt.srcElement;

        var result = func(input.value);
        var textAreaClassName = "form-control ";
        if (elem.value != "") {
            if (result.error == 2) {
                textAreaClassName += "alert-danger";
            }
            else if (result.error == 1) {
                textAreaClassName += "alert-warning";
            }
        }
        elem.className = textAreaClassName;
    }

    addEvent(elem, 'change', test);
    addEvent(elem, 'keyup', test);
    addEvent(elem, 'focus', test);
    addEvent(elem, 'blur', test);
    addEvent(elem, 'mouseup', test);
    elem.focus();
    elem.blur();
}


/* -FUNCTION--------------------------------------------------------------------
	Function:		vysledkovePole(idOtazky, pripona)
	Author:			Petr Hlineny (from his site, but maybe author is different)
					edited by Radim Cebis for my purpose		
	Usage:			returns element of answer field
----------------------------------------------------------------------------- */
/* Funkce vrati odkaz-ukazatel na vysledkove pole k nasi otazce
 * idOtazky - jednoznacny identifikator otazky
 * pripona - pripona vysledkoveho pole ('_t_a_1' atd.)
 * 
 * Pro pouziti zapsat do HTML toto (jedinecne!) na zacatku kazde otazky:
 * 	<input name="idOtazky" type="hidden" value=""/>
 * Predpokladame existenci predchoziho <input> ve stejnem formulari nesouciho
 * IS-identifikaci teto otazky, kterou tak precteme...
 */
function vysledkovePole(idOtazky, pripona) {
	var inputname = 'XX'; // promena slouzi k ulozeni jedinecneho jmena diky nemuz pristupujeme k vysledkovemu poli
	var vse = document.forms; // do promenne se ulozi vsechny tagy <form> pro vyhledani
	
	// vyhledam spravny testovy <form> podle jmena "testform"
	for (i=vse.length-1; i>=0; i--) {
		if (vse[i].name == 'testform') {
			vse = vse[i].elements;  i = -1111;
		}	// do promenne vse se nyni ulozi vsechny elementy nalezeneho tagu <form>
	}
	// vyhledame nazev elementu do ktereho budeme ukladat vysledek
	if (vse!=null)  for (i=vse.length-1; i>=0; i--) {
		if (vse[i].name == idOtazky) {
			inputname = vse[i-1].value + pripona;
		}
	}
	var ukazatelVysPo = document.getElementsByName(inputname); // do promenne se ulozi ukazatel na vysledkove pole

	if (vse==null || ukazatelVysPo==null) {
		alert("vysledkovePole "+idOtazky+" "+inputname+" nenalezeno!!!");
		return null;
	}
	if (ukazatelVysPo.length!=1) {
		alert("vysledkovePole "+idOtazky+" "+inputname+" nejednoznacne!!! num "+ukazatelVysPo.length);
	}
	
	return ukazatelVysPo[0];
}

/* -FUNCTION--------------------------------------------------------------------
	Function:		jeProhlizeciStranka()
	Author:			Petr Hlineny (from his site, but maybe author is different)					
	Usage:			returns if the page is in inspection mode or not...
----------------------------------------------------------------------------- */
/* Funkce zjisti, zda aktualni stranka je v modu prohlizeni testu (tj. ne skladani).
 * Pomocne pro pouziti v zacniVysledkovaPole() a zapisVysledkovaPoleAT().
 */
function jeProhlizeciStranka_original() {
	var vse = document.forms; // do promenne se ulozi vsechny tagy <form> pro vyhledani
	// vyhledam spravny testovy <form> podle jmena "testform"
	for (i=vse.length-1; i>=0; i--) {
		if (vse[i].name == 'testform') {
			vse = vse[i].elements;  
			i = -1111;
		}	// do promenne vse se nyni ulozi vsechny elementy nalezeneho tagu <form>
	}
	// vyhledame nazev elementu 'prohlidka', ktery by se mel vyskytovat jen v prohlizecich modech
	if (vse!=null)  for (i=vse.length-1; i>=0; i--) {
		if (vse[i].name == 'prohlidka' && vse[i].value>0) {
			return true;
		}
	}
	return false;	// prohlizeci identifikator nenalezen
};

/* -FUNCTION--------------------------------------------------------------------
	Function:		htmlentities( s )
	Author:			Kevin van Zonneveld (http://kevin.vanzonneveld.net)					
	Usage:			converts special characters in string to its html entities
----------------------------------------------------------------------------- */
function htmlentities( s ){
    // http://kevin.vanzonneveld.net
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: htmlentities('Kevin & van Zonneveld');
    // *     returns 1: 'Kevin &amp; van Zonneveld'
 
    var div = document.createElement('div');
    var text = document.createTextNode(s);
    div.appendChild(text);
    return div.innerHTML;
}
