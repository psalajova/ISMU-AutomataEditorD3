// -------------------
//  CS
// -------------------

var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabulka";
var hintLabel = "Nápověda";
var addTransitionPrompt = "Zadejte symboly přechodu:";
var renameStatePrompt = "Zadejte nový název stavu:";
var stateNameAlreadyExistsPrompt = "<strong>Chyba:</strong> Takto pojmenovaný stav již existuje.";
var edgeAlreadyExistsAlert = "Přechod mezi těmito stavy již existuje. <br>Chcete-li přidat přechod pod nějakým symbolem, upravte symboly stávajícího přechodu.";
var DFA_invalid_transition = "<strong>Chyba:</strong> Zadání vyžaduje determinizmus (přechod z tohoto stavu pod alespoň jedním z těchto symbolů do jiného stavu už existuje).";


const tableInitialButtonName = "Počáteční stav"; 
const tableAcceptingButtonName = "Akceptující stav";

//state context menu
var addTransitionText = "Přidať prechod";
var renameStateText = "Přejmenovat";
var deleteStateText = "Odstranit";
var setAsInitialText = "Nastavit jako počáteční";
var setStateAsAcceptingText = "Nastavit jako akceptující";
var setStateAsNonAcceptingText ="Nastavit jako neakceptující";

var renameEdgeText = "Upravit symboly přechodu";

var enterToRename = "Pro uložení stiskněte ENTER"; //Press ENTER to save changes

var hints = {
  HINT_ADD_STATE : "<b>Vytvoření stavu:</b> double click na plátno nebo right click na plátno.",
  HINT_ADD_TRANSITION : "<b>Vytvoření prechodu:</b> click na stav + click na cílový stav.",
  HINT_MOVE : "Stavy i přechody můžete přesouvat taháním myší.",
  HINT_STATE_CONTEXT_MENU: "Kliknutím pravého tlačítka myši na stav otevřete menu, kde můžete stav <b>přejmenovat, odstranit, nastavit jako počáteční, označit jako akceptující/neakceptujúci</b>.",
  HINT_TRANSITION_CONTEXT_MENU: "Kliknutím pravého tlačítka myši na přechod otevřete menu, kde můžete <b>upravit symboly přechodu</b> nebo přechod <b>odstranit</b>.",
  HINT_RENAME : "Pro uložení změn po přejmenování stiskněte ENTER nebo klikněte vedle.",
  HINT_DELETE_ELEMENT : "Vymazat stav/přechod můžete i označením daného elementu a stisknutím klávesy DEL.",
  
}

var STATE_SYNTAX = "{a-z,A-Z,0-9}";
//TODO
var DFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}";
var EFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}, \\e nebo ε";
var INVALID_SYNTAX_ERROR = "<strong>Chyba:</strong> Nevyhovující syntax!";

var errors = {
  TABLE_LOCKED : "Tabulka je uzamčena dokud nebude chyba opravena.",
  INCORRECT_STATE_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax názvu stavu (řetězec znaků z {a-z,A-Z,0-9}). ",
  DUPLICIT_STATE_NAME : "<strong>Chyba!</strong> Duplicitní název stavu není povolen.",
  EMPTY_STATE_NAME: "<strong>Chyba!</strong> Prázdný název stavu není povolen.",
  EFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}, \\e nebo ε).",
  NFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}).",
  EMPTY_TRANSITION: "<strong>Chyba!</strong> Nelze přidat prázdný přechod.",
  DUPLICIT_TRANSITION_SYMBOL : "<strong>Chyba!</strong> Duplicitní název symbolu přechodu není povolen.",
  INCORRECT_TRANSITION_SYNTAX: "<strong>Chyba!</strong> Nevyhovující syntax výsledku přechodové funkce.",
  NFA_TRANSITION_EXPECTED_SYNTAX: "Očekávané řetězce znaků z {a-z,A-Z,0-9} oddělené čárkami, uzavřeny do složených závorek {}.",
  DFA_TRANSITION_EXPECTED_SYNTAX: "Očekávané řetězce znaků z {a-z,A-Z,0-9} oddělené čárkami.",
  
}

var delSymbol = "×";
var addSymbol = "+";
var initSymbol = "→";
var accSymbol = "←";
var bothSymbol = "↔";
var epsSymbol = 'ε';

"Očekávané řetězce znaků z {a-z,A-Z,0-9,\\e,ε} oddělené čárkami."


var syntaxDivTitle = "Nápověda syntaxe učitele.";
var syntaxTextDefault = "Zde se zobrazuje nápověda syntaxe.";