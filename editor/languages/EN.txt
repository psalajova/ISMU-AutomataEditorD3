/**
 * English language for finite automata editor
 */

/* ------------------------------ symbols ------------------------------ */
var delSymbol = "×"; //table delete row/column
var addSymbol = "+"; //table add row/column
var initSymbol = "→";
var accSymbol = "←";
var bothSymbol = "↔";
var epsSymbol = 'ε';

/* ------------------------------ main menu ------------------------------ */
var graphMenuButton = "Graph";
var textMenuButton = "Text";
var tableMenuButton = "Table";
var hintLabel = "Hint";
var hintTitle = "How to use graph editor";

var tableInitialButtonName = "Initial state"; //table button to toggle initial state
var tableAcceptingButtonName = "Accepting state"; //table button to toggle accepting state

/* ------------------------------ context menus ------------------------------ */
//state
var renameStateText = "Rename";
var deleteStateText = "Delete";
var setAsInitialText = "Set as initial";
var setStateAsAcceptingText = "Set as accepting";
var setStateAsNonAcceptingText ="Set as not accepting";

//edge
var deleteEdgeText = "Delete";
var renameEdgeText = "Edit transition symbols";

//new state
var addStateText = addSymbol + " New state";


/* ------------------------------ hint ------------------------------ */
var hints = {
  addState : "<b>Create state:</b> double click on canvas or right click on canvas + New state.",
  addTransition : "<b>Create transition:</b> click on state + click on another state (or the same state to create a selfloop).",
  drag : "You can drag both states and transitions.",
  stateMenu: "Right clicking on a state will open a menu where you can <b>rename</b> or <b>delete</b> state, <b>set state as initial</b>, <b>set state as accepting/not accepting</b>.",
  transitionMenu: "Right clicking on a transition will open a menu where you can <b>edit symbols</b> or <b>delete</b> transition.",
  rename : "Transition can also be edited by double clicking. To save changes press ENTER.",
  delete : "Deleting a state or transition is also possible by selecting the element and pressing DEL.",
}


/* ------------------------------ errors ------------------------------ */
var STATE_SYNTAX = "{a-z,A-Z,0-9}";
var DFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}";
var EFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}, \\e, ε}";
var INVALID_SYNTAX_ERROR = "<strong>Error:</strong> Wrong syntax!";

var errors = {
  tableLocked : "Table is locked until the error is fixed.",

  //table row headers (state names) errors
  incorrectStateSyntax : "<strong>Error!</strong> Wrong state name syntax. Expected string of characters from "+ STATE_SYNTAX + ". ",
  duplicitState : "<strong>Error!</strong> Duplicit state name.",
  emptyState: "<strong>Error!</strong> Empty state name.",

  //table header cells (transition symbols) errors
  EFA_incorrectTransitionSymbol : "<strong>Error!</strong> Wrong transition syntax (expected a character from {a-z,A-Z,0-9}, \\e or ε).",
  NFA_incorrectTransitionSymbol : "<strong>Error!</strong> Wrong transition syntax (expected a character from z {a-z,A-Z,0-9}).",
  emptyTransition: "<strong>Error!</strong> Transition can't be empty.",
  duplicitTransitionSymbol : "<strong>Error!</strong> Duplicit transition symbol.",

  // table inner cell errors
  innerCellIncorrectSyntaxBase: "<strong>Error!</strong> Wrong syntax of the result of the transition function.",
  NFAInnerCellSyntax: "Expected string of characters from "+ STATE_SYNTAX + " separated by commas, enclosed in braces {}.",
  DFAInnerCellSyntax: "Expected string of characters from "+ STATE_SYNTAX + ".",

  transitionSymbolsTooLong: "Too many symbols! (Maximum transition symbol count is 300)",
  stateNameTooLong: "State name is too long (max. 50 characters)."
}

var stateNameAlreadyExists = "<strong>Error:</strong> State with this name already exists.";
var edgeAlreadyExistsAlert = "Transition between these two states already exists.<br>Edit the existing transition to add symbols.";
var DFAInvalidTransition = "<strong>Error:</strong> The automaton has to be <b>deterministic</b> (transition from this state with at least one of these symbols to another state already exists).";

var expectedEFASyntax = "Expected symbols from " + EFA_TRANSITION_SYNTAX + ", or string of characters of " + EFA_TRANSITION_SYNTAX + " enclosed in quotation marks  \"\", separated by commas."
var expectedDFASyntax = "Expected symbols from " + DFA_TRANSITION_SYNTAX + ", or string of characters of " + DFA_TRANSITION_SYNTAX + " enclosed in quotation marks  \"\", separated by commas."


var tableDelSymbolHover = "Delete column (deletes symbol from all transitions)";
var tableDelRowHover = "Delete row (deletes state and all its transitions)";
var tableAddRowHover = "New state";
var tableAddSymbolHover = "New symbol";

var emptyGraphText = "Double click to create first state.";

/* ------------------------------ syntax check div ------------------------------ */
//currently unused
var syntaxDivTitle = "Syntax help.";
var syntaxTextDefault = "Syntax help is displayed here. ";