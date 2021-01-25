// -------------------------------------------------------------------------------
// syntax 
// -------------------------------------------------------------------------------

function stateSyntax() {
    return /^[a-zA-Z0-9]+$/;
}

function incorrectStateSyntax(val) {
    return !(stateSyntax().test(val));
}

function graphTransitionsSyntax() {
    return /^(([a-zA-Z0-9]+))(,(([a-zA-Z0-9]+)))*$/; 
}

function graphEFATransitionSyntax() {
    return /^(([a-zA-Z0-9]+)|(ε)|(\\e))(,(([a-zA-Z0-9]+)|(ε)|(\\e)))*$/;
}

function incorrectGraphTransitionsSyntax(type, value) {
    return ( (type == "DFA" || type == "NFA") && !graphTransitionsSyntax().test(value) ) ||
             (type == "EFA" && !graphEFATransitionSyntax().test(value));
}

function tableEFATransitionSyntax() {
    return /^ε$|^\\$|^[a-zA-Z0-9]+$/;
}

function tableNfaEfaInnerCellSyntax() {
    return /^\{\}$|^\{[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*\}$/;
}

function tableIncorrectNfaEfaInnerCellSyntax(val) {
    return (!tableNfaEfaInnerCellSyntax().test(val))
}

function EFATransitionSyntax() {
    return /^ε$|^\\e$|^[a-zA-Z0-9]+$/;
}

function incorrectTableEFATransitionSyntax(val) {
    return (!EFATransitionSyntax().test(val))
}

function NFATransitionSyntax() {
    return /^[a-zA-Z0-9]+$/;
}

function incorrectTableNFATransitionSyntax(value) {
    return !NFATransitionSyntax().test(value);
}

function DFATransitionSymbolsSyntax() {
    return /^[a-zA-Z0-9]+$/;
}

function incorrectDFATransitionSymbolsSyntax(val) {
    return (!DFATransitionSymbolsSyntax().test(val))
}

function tableDFAInnerCellSyntax() {
    return /^$|^[a-zA-Z0-9]+$/;
}

function tableIncorrectDFAInnerCellSyntax(val) {
    return (!tableDFAInnerCellSyntax().test(val))
}

function incorrectTableInnerCellSyntax(type, value) {
    return (type == "DFA" && tableIncorrectDFAInnerCellSyntax(value)) ||
        (typeIsNondeterministic(type) && tableIncorrectNfaEfaInnerCellSyntax(value));
}

function incorrectTableColumnHeaderSyntax(type, value) {
    return (type == "DFA" && incorrectDFATransitionSymbolsSyntax(value) ||
        (type == "EFA" && incorrectTableEFATransitionSyntax(value)) ||
        (type == "NFA" && incorrectTableNFATransitionSyntax(value))
    );
}