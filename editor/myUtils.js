function removeDuplicates(array) {
    return array.filter(function (item, pos) { 
        return item != '' && array.indexOf(item) == pos; 
    });
}

function findStatePlacement(questionDiv, newStateData) {
    console.log("finding placement");
    var states = questionDiv.statesData;
    //var edges = questionDiv.edgesData;

    var x = 100;
    var y = 100;

    var mult = 5;
    //var w = 2 * x + (Math.ceil(Math.sqrt(states.length)) - 1) * (graphConsts.nodeRadius * mult);

    while (invalidStatePosition(states, newStateData)) {
        x += graphConsts.nodeRadius * mult;
        if (x > questionDiv.graphDiv.lastWidth) {
            x = 100;
            y += graphConsts.nodeRadius * mult;
        }
        if (y + graphConsts.nodeRadius + 100 > questionDiv.graphDiv.lastHeight) {
            questionDiv.graphDiv.style.height = y + graphConsts.nodeRadius + 100;
        }
        newStateData.x = x;
        newStateData.y = y;
    }

    newStateData.isNew = false;
    return newStateData;
}

function reverseCalculateEdge(source, target, dx, dy) {
    var s1 = source;
    var s2 = target;

    var c1 = ( (s1.x + s2.x) / 2) + dx;
    var c2 = ( (s1.y + s2.y) / 2) + dy;

    return "M " + s1.x + " " + s1.y + " Q " + c1 + " " + c2 + " " + s2.x + " " + s2.y;
}

function invalidStatePosition(states, state) {
    for (var i = 0; i < states.length; i++) {
        if (state.id == states[i].id) {
            continue;
        }
        if ((Math.abs(states[i].x - state.x) < graphConsts.nodeRadius * 2)
            && (Math.abs(states[i].y - state.y) < graphConsts.nodeRadius * 2))
        {
            console.log("collision");
            return true;
        }
    }
    return false;
}

function calculateSelfloop(x, y, angle) {
    return "M " + x + " " + y 
        + " C " + cubicControlPoints(x, y, angle)
        + " " + x + " " + y;
}

function updateSvgDimensions(questionDiv) {
    questionDiv.graphDiv.lastHeight = questionDiv.graphDiv.offsetHeight;
    questionDiv.graphDiv.lastWidth = questionDiv.graphDiv.offsetWidth;
}