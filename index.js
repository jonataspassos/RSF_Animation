//none stoped created started paused
var state = "none";
var rsf;

//Interactions
var last_d = undefined;
var chart = jg.chart_line().width(181.93).height(65.5);
function queue_click(d){
    d3.select("#interaction-title").text("Sistema de Fila "+d.id);
    d3.select(".interaction").select(".card").classed("border-danger",d.busy())
        .classed("border-success",!d.busy())
    d3.select("#interaction-queue-u").text(Math.round(d.U*100)+"%");
    d3.select("#interaction-queue-mi").text(d.μ);
    d3.select("#interaction-queue-nf-now").text(d.nf);
    d3.select("#interaction-queue-nf-mean").text(d.E("nf").toFixed(2));
    d3.select("#interaction-queue-nf-max").text(Math.round(d.max_nf));
    d3.select("#interaction-queue-tts")//.transition().duration(1000)
        .call(chart.data([{category:"1",list:d.tts_data}]))
        .select("svg").attr("style","padding-left:20px").attr("width","100%").attr("height","100%");
    d3.select(".queue-"+d.id).classed("shadow-active",true).attr("filter","url(#shadow)");
    //
}

function interaction_click(d){
    if(!rsf || !transition_duration)
        return;
    d = d?d:last_d;
    last_d = d;
    if(!d){
        interaction_close();
        return;
    }
    d3.selectAll(".interaction-card").attr("style","display:none;");
    d3.selectAll(".shadow-active").classed("shadow-active",false).attr("filter",null);
    if(d instanceof Queue){
        queue_click(d);
        d3.selectAll("#interaction-queue-card").attr("style","display:inherit;");
    }
    d3.select(".interaction").transition().duration(transition_duration/2).attr("transform","translate(950,-260)");
}

function interaction_close(){
    last_d = null;
    d3.select(".interaction").transition().duration(transition_duration/2).attr("transform","translate(950,0)");
    d3.selectAll(".shadow-active").classed("shadow-active",false).attr("filter",null);
}

//Stopwatch
var time_show = true;
var stopwatch_interval;
var minute_angle = 240;
function stopwatch_play() {
    var stopwatch = d3.select(".stopwatch");
    function stopwatch_format(s) {
        var v = s.match(/([0-9]{2})/g);
        return v ? v.map((d, i) => d * Math.pow(60, 1 - i)).reduce((t, d) => t + d) : 0;

    }
    function run() {
        var time = rsf ? rsf.time : 0;
        var mili = Math.round(time * time_turn * 1000) % 1000;
        var seconds = Math.floor(time * time_turn);
        stopwatch
            .selectAll("text").data([seconds, mili, time, 999, Package.counter])
            .transition().ease(d3.easeLinear)
            .duration(state_duration)
            .tween("text", function (d, j) {
                var v = 0;
                switch (j) {
                    case 0: v = stopwatch_format(this.textContent); break;
                    case 3: v = 0; break;
                    default: v = parseInt(this.textContent); break
                }
                var i = d3.interpolate(v, d);
                switch (j) {
                    case 0: return function (t) {
                        this.textContent = `${Math.floor(i(t) / 60) < 10 ? "0" : ""}${Math.floor(i(t) / 60)
                            }:${Math.floor(i(t) % 60) < 10 ? "0" : ""}${Math.floor(i(t) % 60)}`;
                    };
                    case 1: case 3: return function (t) {
                        this.textContent = `${i(t) < 100 ? "0" : ""}${i(t) < 10 ? "0" : ""}${Math.floor(i(t))}`;
                    }
                    default: return function (t) { this.textContent = Math.round(i(t)) };
                }
            });

        d3.select("#second-stopwatch").transition().ease(d3.easeLinear)
            .duration(state_duration/2).attr("transform", "rotate(180)")
        d3.select("#second-stopwatch").transition().ease(d3.easeLinear)
            .delay(state_duration/2)
            .duration(state_duration/2).attr("transform", "rotate(359)")
        minute_angle += 36;
        d3.select("#minute-stopwatch").transition().ease(d3.easeLinear)
            .duration(state_duration).attr("transform", `rotate(${minute_angle})`);

        d3.select("#turn-stopwatch").select(".time-turn").transition().ease(d3.easeLinear)
            .delay(state_duration).duration(0).text("000");
        d3.select("#second-stopwatch").transition().ease(d3.easeLinear)
            .delay(state_duration).duration(0).attr("transform", "rotate(0)")
        minute_angle = minute_angle % 360;
        d3.select("#minute-stopwatch").transition().ease(d3.easeLinear)
            .delay(state_duration).duration(0).attr("transform", `rotate(${minute_angle})`);
    };
    run();
    if (stopwatch_interval)
        stopwatch_interval = clearInterval(stopwatch_interval), null;
    stopwatch_interval = setInterval(run, transition_duration + state_duration);
}

function stopwatch_pause() {
    if (stopwatch_interval)
        stopwatch_interval = clearInterval(stopwatch_interval), null;
}
function stopwatch_stop() {
    if (stopwatch_interval)
        stopwatch_interval = clearInterval(stopwatch_interval), null;
    d3.select(".stopwatch").selectAll("text").data(["00:00", "000", "0", "000", "0"])
        .text((d) => d);
    setTimeout(() => { d3.select(".stopwatch").selectAll("text").data(["00:00", "000", "0", "000", "0"]) }, 10)
}

function stopwatch_toggle() {
    time_show = !time_show;
    var s = d3.select(".stopwatch")
    s.select("#time-stopwatch").style("display", time_show ? "inherit" : "none");
    s.select("#turn-stopwatch").style("display", !time_show ? "inherit" : "none");
}

//Simulation
function create_netqueue() {
    Queue.counter = 0;
    Package.counter = 0;

    var lambda = parseFloat(document.getElementById("lambda-input").value);
    var mis = document.getElementById("mi-input").value.match(/[0-9]+|(\.[0-9]+)|(\[0-9]+.[0-9]+)/g).map(function (d) { return parseFloat(d) });
    var r = document.getElementById("router-input").value.match(/[0-9]+|(\.[0-9]+)|(\[0-9]+.[0-9]+)/g).map(function (d) { return parseInt(d) });

    pause_simulation()

    var g = d3.select(".net-queue");
    g.selectAll("g").remove();
    rsf = new NetQueue(lambda, mis, r, g).draw();
    g.attr("transform", `translate(${m.rx},${m.ry})${rsf.scale_transform}`)

    stopwatch_stop();

    document.getElementById("start").disabled = false;
    d3.select("#create").text("criar").classed("btn-danger", false).classed("btn-primary", true)
    d3.select("#start").text("iniciar").classed("btn-info", false).classed("btn-success", true);
    state = "created"

    interaction_close()
}
function simulate() {
    if (rsf) {
        rsf.animation_call = setInterval(() => {
            rsf.turn().draw()
            if (rsf.n >= n_package) {
                rsf.close();
            }
            if (rsf.closed && !rsf.busy()) {
                end_simulation()
            }
            interaction_click()
        }, state_duration + transition_duration)

        stopwatch_play();

        d3.select("#start").text("pausar").classed("btn-info", true).classed("btn-success", false);
        d3.select("#create").text("parar").classed("btn-danger", true).classed("btn-primary", false);
        var inputs = document.querySelectorAll(".sf-param")
        for (var i = 0; i < inputs.length; i++)
            inputs[i].disabled = true;
        var inputs = document.querySelectorAll(".animation-param")
        for (var i = 0; i < inputs.length; i++)
            inputs[i].disabled = true;
        state = "started";


    }
}
function pause_simulation() {
    if (rsf && rsf.animation_call)
        clearInterval(rsf.animation_call);

    state = "paused";

    stopwatch_pause();

    d3.select("#start").text("iniciar").classed("btn-info", false).classed("btn-success", true);
    d3.select("#create").text("parar").classed("btn-danger", true).classed("btn-primary", false);
    var inputs = document.querySelectorAll(".animation-param")
    for (var i = 0; i < inputs.length; i++)
        inputs[i].disabled = false;
}
function stop_simulation() {
    Queue.counter = 0;
    Package.counter = 0;

    var l = rsf.l/time_turn;
    var m = rsf.m.map((d) => d);
    var r = rsf.r;

    pause_simulation();
    stopwatch_stop();

    var g = d3.select(".net-queue");
    g.selectAll("g").remove();
    rsf = new NetQueue(l, m, r, g).draw();


    var inputs = document.querySelectorAll("input")
    for (var i = 0; i < inputs.length; i++)
        inputs[i].disabled = false;

    d3.select("#create").text("criar").classed("btn-danger", false).classed("btn-primary", true)
    d3.select("#start").text("iniciar").classed("btn-info", false).classed("btn-success", true);
    state = "stoped";

    interaction_close()

}
function end_simulation() {
    pause_simulation();

    var modal = d3.select("#endSimulationModal");
    modal.select("#nqueue-modal").text(rsf.nqueue);
    modal.select("#router-modal").text(rsf.router);
    modal.select("#lambda-modal").text(rsf.λ);
    modal.select("#imc-modal").text(rsf.imc.toFixed(3));

    var table_param = modal.select("#queue-parameters-modal");
    table_param.selectAll("tr").remove();
    table_param.selectAll("tr").data(rsf.queues).enter()
        .append("tr")
        .html(function (d, i) {
            return `<th scope="col">${i}</th>` +
                `<td scope="col">${d.μ} pps</td>` +
                `<td scope="col">${d.tms.toFixed(3)} s</td>`
        })

    var table_results = modal.select("#queue-results-modal");
    table_results.selectAll("tr").remove();
    table_results.selectAll("tr").data(rsf.queues).enter()
        .append("tr")
        .html(function (d, i) {
            return `<th scope="col">${i}</th>` +
                `<td scope="col">${d.T.toFixed(3)}</td>` +
                `<td scope="col">${d.N}</td>` +
                `<td scope="col">${(d.U * 100).toFixed(1)}</td>` +
                `<td scope="col">${d.E("nf").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("nf").toFixed(3)}</td>` +
                `<td scope="col">${d.E("tts").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("tts").toFixed(3)}</td>` +
                `<td scope="col">${d.E("ic").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("ic").toFixed(3)}</td>` +
                `<td scope="col">${d.E("ts").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("ts").toFixed(3)}</td>` +
                `<td scope="col">${d.E("tef").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("tef").toFixed(3)}</td>` +
                `<td scope="col">${d.E("tps").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("tps").toFixed(3)}</td>` +
                `<td scope="col">${d.E("is").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("is").toFixed(3)}</td>` +
                `<td scope="col">${(d.p0 * 100).toFixed(1)}</td>`
        })

    $('#endSimulationModal').modal('show');
}

//Results
function save_simulation() {
    var save = d3.select("#save");
    save.select("#nqueue-modal").text(rsf.nqueue);
    save.select("#router-modal").text(rsf.router);
    save.select("#lambda-modal").text(rsf.λ);
    save.select("#imc-modal").text(rsf.imc.toFixed(3));

    var table_param = save.select("#queue-parameters-save");
    table_param.selectAll("tr").remove();
    table_param.selectAll("tr").data(rsf.queues).enter()
        .append("tr")
        .html(function (d, i) {
            return `<th scope="col">${i}</th>` +
                `<td scope="col">${d.μ} pps</td>` +
                `<td scope="col">${d.tms.toFixed(3)} s</td>`
        })

    var table_results = save.select("#queue-results-save");
    table_results.selectAll("tr").remove();
    table_results.selectAll("tr").data(rsf.queues).enter()
        .append("tr")
        .html(function (d, i) {
            return `<th scope="col">${i}</th>` +
                `<td scope="col">${d.T.toFixed(3)}</td>` +
                `<td scope="col">${d.N}</td>` +
                `<td scope="col">${(d.U * 100).toFixed(1)}</td>` +
                `<td scope="col">${d.E("nf").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("nf").toFixed(3)}</td>` +
                `<td scope="col">${d.E("tts").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("tts").toFixed(3)}</td>` +
                `<td scope="col">${d.E("ic").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("ic").toFixed(3)}</td>` +
                `<td scope="col">${d.E("ts").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("ts").toFixed(3)}</td>` +
                `<td scope="col">${d.E("tef").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("tef").toFixed(3)}</td>` +
                `<td scope="col">${d.E("tps").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("tps").toFixed(3)}</td>` +
                `<td scope="col">${d.E("is").toFixed(3)}</td>` +
                `<td scope="col">${d.σ("is").toFixed(3)}</td>` +
                `<td scope="col">${(d.p0 * 100).toFixed(1)}</td>`
        })

    downloadFile(save.html(), `RSF.MM1.id-${rsf.id}.html`);
}
function save_log() {
    var sep = ";";
    var line = "\n";
    str = ["id", "queue", "nf", "ic", "ts", "tcf", "tis", "tfs", "is"].join(sep)
        + line
        + rsf.queues.map((d, i) => {
            return d.log.map((e) => {
                return [e.id, i, e.nf, e.ic, e.ts, e.tcf, e.tis, e.tfs, e.is]
                    .join(sep);
            }).join(line);
        }).join(line);
    downloadFile(str, `RSF.MM1.id-${rsf.id}-log.csv`);
}

//Comportamento dos botões
function btn_create() {
    switch (state) {
        case "none": case "stoped": case "created":
            create_netqueue(); break;
        default: stop_simulation();
    }
}
function btn_start() {
    switch (state) {
        case "started": pause_simulation(); break;
        default: simulate();
    }
}
function btn_settings() {
    document.getElementById("n-package-input").value = "" + n_package;
    document.getElementById("turn-input").value = "" + time_turn;
    document.getElementById("transition-input").value = "" + transition_duration;
    document.getElementById("interval-input").value = "" + state_duration;
}
function btn_update() {
    n_package = parseFloat(document.getElementById("n-package-input").value);
    time_turn = parseFloat(document.getElementById("turn-input").value);
    transition_duration = parseFloat(document.getElementById("transition-input").value);
    state_duration = parseFloat(document.getElementById("interval-input").value);
}

//Legenda
var legend_status = false;
function btn_legend() {
    legend_status = !legend_status;
    d3.select(".legend").transition().duration(500)
        .attr("transform", `translate(10,${legend_status ? -210 : -15})`)
        .select(".minimizer").select("path").attr("d", legend_status ? "M 4 8 L 10 16 16 8" : "M 4 12 L 10 4 16 12")
}

//Translate Settings
var n = { rx: 0, ry: 0 }
var drag = (() => {
    function dragstarted(event) {
        n.x = event.x;
        n.y = event.y;
    }
    function dragged(event) {

        d3.select(".translate-transform")
            .attr("transform", `translate(${n.rx - n.x + event.x},${n.ry - n.y + event.y})`);
    }
    function dragended(event) {
        //d3.select(this).attr("stroke", null);
        n.rx += event.x - n.x;
        n.ry += event.y - n.y;
    }
    return d3.drag().on("start", dragstarted)
        .on("drag", dragged).on("end", dragended);
})();
function resettranslation() {
    n = { rx: 0, ry: 0 }
    d3.select(".translate-transform")
        .attr("transform", `translate(0,0)`);
}

//Zoom Settings
var scale = 1;
var m = { rx: 0, ry: 0 };
function zoom(z, x, y) {
    var last = scale;
    if (typeof z == "number")
        scale = z;
    else
        scale *= z ? 1.1 : (1 / 1.1);
    x = isNaN(x) ? 600 : x;
    y = isNaN(y) ? 300 : y;


    x = x / 1200;
    y = y / 600;

    x *= (scale - last) * 1200;
    y *= (scale - last) * 600;

    m.rx -= x;
    m.ry -= y;

    d3.select(".scale-transform")
        .attr("transform", `scale(${scale},${scale})`);

    d3.select(".net-queue")
        .attr("transform", `translate(${m.rx},${m.ry})${rsf ? rsf.scale_transform : ""}`);
    document.querySelector("#zoom-value-input").value = `${Math.round(scale * 100)}%`;
    event.returnValue = false;
}

function input_zoom(e) {
    zoom(parseFloat(e.target.value) / 100);
}
document.querySelector("#zoom-value-input")
    .addEventListener('change', input_zoom);


function resetzoom() {
    scale = 1;
    m = { rx: 0, ry: 0 };
    d3.select(".net-queue")
        .attr("transform", `translate(0,0)${rsf ? rsf.scale_transform : ""}`)
    d3.select(".scale-transform")
        .attr("transform", `scale(1,1)`);
    document.querySelector("#zoom-value-input").value = `100%`
}

function btn_resetzoom() {
    resettranslation()
    resetzoom()
}

d3.select(".drag-region").call(drag).on("wheel", (event) => {
    zoom(event.wheelDelta > 0, event.x, event.y);
});


document.getElementById("lambda-input").value = "1000";
document.getElementById("mi-input").value = "2500 4750 1250 1250";
document.getElementById("router-input").value = "0 1 2 1 3 1 0"

n_package = 100;
time_turn = 0.0001;
transition_duration = 2000;
state_duration = 500;

btn_settings();

resetzoom();

/*

*/