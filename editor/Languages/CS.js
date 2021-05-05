/**
 * Czech language for finite automata editor
 */

/* ------------------------------ symbols ------------------------------ */
var delSymbol = "×"; //table delete row/column
var addSymbol = "+"; //table add row/column
var initSymbol = "→";
var accSymbol = "←";
var bothSymbol = "↔";
var epsSymbol = 'ε';
var hintSymbol = "•";

/* ------------------------------ main menu ------------------------------ */
var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabulka";
var hintLabel = "Nápověda";
var hintTitle = "Nápověda k používání grafového editoru";
var syntaxLabel = "Syntax";
var syntaxTitle = "Pravidla syntaxe";

var tableInitialButtonName = "Počáteční stav"; //table button to toggle initial state
var tableAcceptingButtonName = "Akceptující stav"; //table button to toggle accepting state

/* ------------------------------ context menus ------------------------------ */
//state
var renameStateText = "Přejmenovat";
var deleteStateText = "Odstranit";
var setAsInitialText = "Nastavit jako počáteční";
var setStateAsAcceptingText = "Nastavit jako akceptující";
var setStateAsNonAcceptingText ="Nastavit jako neakceptující";

//edge
var deleteEdgeText = "Odstranit";
var renameEdgeText = "Upravit symboly přechodu";

//new state
var addStateText = addSymbol + " Nový stav";

var STATE_SYNTAX = "{a-z,A-Z,0-9}";
var DFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}";
var EFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}, \\e, ε}";
var INVALID_SYNTAX_ERROR = "<strong>Chyba:</strong> Nevyhovující syntax!";

/* ------------------------------ hint ------------------------------ */
var graphHints = {
  addState : "<b>Vytvoření stavu:</b> dvojklikem na plátno nebo kliknutím pravého tlačítka na plátno.",
  addTransition : "<b>Vytvoření prechodu:</b> klik na stav + klik na cílový stav.",
  drag : "Stavy i přechody můžete přesouvat taháním myší.",
  stateMenu: "Kliknutím pravého tlačítka myši na stav otevřete menu, kde můžete stav <b>přejmenovat, odstranit, nastavit jako počáteční, označit jako akceptující/neakceptujúci</b>.",
  transitionMenu: "Kliknutím pravého tlačítka myši na přechod otevřete menu, kde můžete <b>upravit symboly přechodu</b> nebo přechod <b>odstranit</b>.",
  rename : "Přechod můžete upravit i dvojklikem. Pro uložení změn po přejmenování stiskněte ENTER.",
  delete : "Vymazat stav/přechod můžete i označením daného elementu a stisknutím klávesy DEL.",
}

var graphSyntaxHints = {
  states: `<b>Název stavu:</b> řetězec znaků z ${STATE_SYNTAX}.`,
  transition: `<b>Symbol (znak) přechodu:</b> znak z ${DFA_TRANSITION_SYNTAX}, nebo sekvence jakýchkoli znaků (kromě uvozovek a bílých znaků) uzavřena v uvozovkách.`,
  efa: `V nedeterminstických automatech s ε-kroky se přechod pod prázdným slovem zapisuje pomocí znaku ε nebo \\e.`,
  commas: `Přechod pod více znaky se zapisuje jako jednotlivé znaky oddělené čárkami (např. <code>a,c</code>; <code>b,ε,a</code>; <code>"dog","cat","mouse"</code>;).`,
  lang: `Abeceda jazyka rozpoznávaného automatem je dána znaky, které se objeví na jeho přechodech.`
}

var tableSyntaxHints = {
  a: graphSyntaxHints.states,
  b: graphSyntaxHints.transition,
  c: graphSyntaxHints.efa,
  d: graphSyntaxHints.lang,
  e: `<b>Výsledek přechodové funkce</b>: název stavu, v případě nedeterministického automatu množina obsahující názvy stavů (např. <code>{s1,s2,s3}</code>)`,
}

/* ------------------------------ errors ------------------------------ */

var errors = {
  tableLocked : "Tabulka je uzamčena dokud nebude chyba opravena.",

  //table row headers (state names) errors
  incorrectStateSyntax : "<strong>Chyba!</strong> Nevyhovující syntax názvu stavu. Očekávaný řetězec znaků z "+ STATE_SYNTAX + ". ",
  duplicitState : "<strong>Chyba!</strong> Duplicitní název stavu není povolen.",
  emptyState: "<strong>Chyba!</strong> Prázdný název stavu není povolen.",

  //table header cells (transition symbols) errors
  EFA_incorrectTransitionSymbol : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu.",
  incorrectTransitionSymbol : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu.",
  emptyTransition: "<strong>Chyba!</strong> Nelze přidat prázdný přechod.",
  duplicitTransitionSymbol : "<strong>Chyba!</strong> Duplicitní název symbolu přechodu není povolen.",

  // table inner cell errors
  innerCellIncorrectSyntaxBase: "<strong>Chyba!</strong> Nevyhovující syntax výsledku přechodové funkce.",
  NFAInnerCellSyntax: "Očekávané názvy stavů oddělené čárkami, uzavřeny do složených závorek {}.",
  DFAInnerCellSyntax: "Očekávaný název stavu",

  transitionSymbolsTooLong: "Překročena maximální délka symbolů přechodu (max. 300 znaků)!",
  stateNameTooLong: "Název stavu je příliš dlouhý (max. 50 znaků)."
}

var stateNameAlreadyExists = "<strong>Chyba:</strong> Takto pojmenovaný stav již existuje.";
var edgeAlreadyExistsAlert = "Přechod mezi těmito stavy již existuje. <br>Chcete-li přidat přechod pod nějakým symbolem, upravte symboly stávajícího přechodu.";
var DFAInvalidTransition = "<strong>Chyba:</strong> Zadání vyžaduje <b>determinizmus</b> (přechod z tohoto stavu pod alespoň jedním z těchto symbolů do jiného stavu již existuje).";

var tableDelSymbolHover = "Vymazat sloupec (symbol ze všech přechodů)";
var tableDelRowHover = "Vymazat řádek (stav a všechny jeho přechody)";
var tableAddRowHover = "Přidat stav";
var tableAddSymbolHover = "Přidat symbol";

var emptyGraphText = "První stav vytvoříte dvojklikem.";

/* ------------------------------ syntax check div ------------------------------ */
//currently unused
var syntaxDivTitle = "Nápověda syntaxe učitele.";
var syntaxDefaultText = "Zde se zobrazuje nápověda syntaxe.";
var syntaxIsCorrect = "Syntax je korektní.";

/* ------------------------------ IS related ------------------------------ */
var browse = "– prohlídka";
var browse2 = "Prohlídka";