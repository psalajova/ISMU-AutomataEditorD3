function removeDuplicates(array) {
    return array.filter(function (item, pos) {
        return item != '' && array.indexOf(item) == pos;
    });
}

function intersects(array1, array2) {
    for (let i = 0; i < array1.length; i++) {
        if (array2.includes(array1[i])) {
            return true;
        }
    }
    return false;
}

function findStatePlacement(questionDiv, newStateData) {
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

    var c1 = ((s1.x + s2.x) / 2) + dx;
    var c2 = ((s1.y + s2.y) / 2) + dy;

    return "M " + s1.x + " " + s1.y + " Q " + c1 + " " + c2 + " " + s2.x + " " + s2.y;
}

function invalidStatePosition(states, state) {
    for (var i = 0; i < states.length; i++) {
        if (state.id == states[i].id) {
            continue;
        }
        if ((Math.abs(states[i].x - state.x) < graphConsts.nodeRadius * 2)
            && (Math.abs(states[i].y - state.y) < graphConsts.nodeRadius * 2)) {
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

function closestPointOnCircle(x1, y1, circleX, circleY) {
    var dx = x1 - circleX;
    var dy = y1 - circleY;
    var scale = Math.sqrt(dx * dx + dy * dy);
    return {
        x: (circleX + dx * (graphConsts.nodeRadius + 4) / scale),
        y: (circleY + dy * (graphConsts.nodeRadius + 4) / scale),
    };
}

var TEST_GRAPH1 = "init=s1 (s1,a)=s2 (s1,b)=s2 (s2,c)=s3 (s2,d)=s3 (s3,\"pepepe\")=s1 (s3,i)=s3 (s3,j)=s3 (s2,E)=s4 (s1,E)=s4 (s3,E)=s4 final{s2,s3}##states##@s1;100;100;1;0@s2;259;362;0;1@s3;443;105;0;1@s4;261;206;0;0##edges##@s1;s2;a,b;-60;83;0.00@s2;s3;c,d;46;48;0.00@s3;s1;\"pepepe\";0;0;0.00@s3;s3;i,j;0;0;-0.35@s2;s4;E;0;0;0.00@s1;s4;E;0;0;0.00@s3;s4;E;0;0;0.00";
var TEST_GRAPH_EFA = "init=s2 (s1,\e)={s2,s3} (s2,a)={s3} (s2,b)={s3,s1} (s1,a)={s4} (s1,b)={s4} (s4,\"string\")={s3} (s3,b)={s2} (s3,\"string\")={s4} (s3,\e)={s4,PEKLO} (s4,a)={s4} (s4,b)={s4} (s4,c)={s4} (PEKLO,\"peklo\")={s3} final={s1,s3,s4,PEKLO}##states##@s1;100;100;0;1@s2;101;388;1;0@s3;288;264;0;1@s4;504;100;0;1@PEKLO;458;419;0;1##edges##@s1;s2;ε;-80;10;0.00@s2;s3;a,b;35;68;0.00@s1;s3;ε;0;0;0.00@s1;s4;a,b;0;0;0.00@s4;s3;\"string\";40;86;0.00@s2;s1;b;0;0;0.00@s3;s2;b;0;0;0.00@s3;s4;\"string\",ε;-32;-18;0.00@s4;s4;a,b,c;0;0;-0.27@s3;PEKLO;ε;-32;43;0.00@PEKLO;s3;\"peklo\";32;-25;0.00";