var time_turn = 0.001,
    transition_duration = 2000,
    state_duration = 1000,
    n_package = 50;

/**
	 * This function copy values of object (JSON Compatible)
	 * and returns another independent instance
	 * @param {Object} object
	 * @return object like parameter
	 */
function deep_copy(object) {
    return JSON.parse(JSON.stringify(object));
}

var colors = ["#F49E4C", "#70D6FF", "#8E4A49", "#38726C",
    "#F5EE9E", "#A075A0", "#70A3FF", "#FF7070",
    "#8DC7C1", "#E4D318", "#472524", "#B8EBFF",
    "#F44B78", "#4BF488", "#F6F0AA", "#4B63F4",
    "#8E4848", "#70FF86", "#F49CF1", "#4B63F4",
]


function downloadFile(content, filename) {
    var supportsDownloadAttribute = 'download' in document.createElement('a');

    if (supportsDownloadAttribute) {
        var link = d3.select("body").append("a")
            .attr("href", 'data:attachment/csv;base64,' + encodeURI(window.btoa(content)))
            .attr("target", '_blank')
            .attr("download", filename)
        link._groups[0][0].click()

        setTimeout(function () {
            link.remove();
        }, 50);
    } else if (typeof safari !== 'undefined') {
        window.open('data:attachment/csv;charset=utf-8,' + encodeURI(content));
    } else {
        var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, filename);
    }
}

/**
 * Returns a array with values orders as like samples:
 * range(5) -> [0,1,2,3,4]
 * range(2,10) -> [2,3,4,5,6,7,8,9]
 * range(2,10,2) -> [2,4,6,8]
 * @param {number} n Min value of range
 * @param {number} max Max value of range
 * @param {number} step Increment of values
 * If is sent one only param, this will represent the max value with step 1
 */
//Retorna um vetor com os valores solicitados em sequencia
//Ex: 
function range(n, max, step) {
    let min = max ? n : 0;
    max = max || n;
    step = step || 1;
    var ret = []
    for (var i = min; i < max; i += step) {
        ret.push(i);
    }
    return ret;
}

/**
	 * This function returns these informations of tag:
	 * x - absolute x in window; 
	 * y - absolute y in window; 
	 * width or w - width of tag area;
	 * height or h - hright of tag area;
	 * left or l - distance of tag to left limit of window;
	 * right or r - distance of tag to right limit of window;
	 * top or t - distance of tag to top limit of window;
	 * bottom or b - distance of tag to bottom limit of window;
	 * @param {String} selector The expression to locate tag;
	 * @returns {Object} infomations about tag area (empty if tag is not found)
	 */
function size_info(selector) {
    var tag = document.querySelector(selector);
    if (tag) {
        var b = tag.getBoundingClientRect();
        b.w = b.width,
            b.h = b.height,
            b.l = b.left,
            b.r = b.right,
            b.t = b.top,
            b.b = b.bottom;
        return b;
    }
    return {};
}

class EDP {
    constructor() {
        this.__s_xi = 0;
        this.__s_xi2 = 0;
        this.__n_1 = -1;
        this.__x_p_1 = 0;
        return this;
    }
    insert(xi) {
        this.__s_xi += this.__x_p_1;
        this.__s_xi2 += this.__x_p_1 * this.__x_p_1;
        this.__n_1++;
        this.__x_p_1 = xi;

        return this;
    }
    get E() {
        return this.n ? (this.__x_p_1 + this.__s_xi) / this.n : 0;
    }
    get μ() {
        return this.E;
    }
    get n() {
        return this.__n_1 + 1;
    }
    get Σ() {
        return this.__s_xi + this.__x_p_1;
    }
    get Σ2() {
        return this.__s_xi2 + this.__x_p_1 * this.__x_p_1;
    }
    get σ() {
        return this.DP;
    }
    get DP() {
        var i = this.__n_1;
        var raiz = Math.sqrt;

        var Xi1 = this.__x_p_1;
        var Ei1 = this.E;

        var Si = this.__s_xi;
        var Si2 = this.__s_xi2;

        var Si1 = Si + Xi1;
        if (i == -1)
            return 0;
        return raiz(
            (Xi1 - Ei1) * (Xi1 - Ei1) / (i + 1) +
            (//delta
                Si1 * Si1 * i + (i + 1) * (i + 1) * Si2 - 2 * Si1 * (i + 1) * Si
            ) / ((i + 1) * (i + 1) * (i + 1))
        );
    }
}

function X(p) {
    var u = (Math.random() + 1.0) / (3.0); // u in (0,1)
    return -p * Math.log(u);
}

class Package {
    static counter = 0;
    static color = d3.scaleOrdinal().domain(range(20)).range(colors);
    constructor(start, g_element) {
        this.id = Package.counter++;

        //Container gráfico
        this.g = g_element.classed("package", true)
            .classed(`package-${this.id}`, true);

        this.start = start;
        this.router = [];// time turn on server input
        this.duration = [];// time duration in server
        this.nf = [];
        //this.update = false;

        return this;
    }
    get timeoutserver() {
        var i = this.router.length - 1;
        return this.duration[i] != -1 ? this.router[i] + this.duration[i] : -1;
    }

    get r() {
        return this.router.length;
    }
    tef(i) {
        i = i | this.r - 1;
        var start = i ? this.router[i - 1] : this.start;
        return this.router[this.r - 1] - start;
    }
    ts(i) {
        i = i | this.r - 1;
        return this.duration[i];
    }
    tps(i) {
        return this.ts(i);
    }
    tts(i) {
        return this.tef(i) + this.tps(i);
    }
    getNf(i) {
        i = i | this.r - 1;
        return this.nf[i];
    }
    T() {
        var ret = 0;
        for (var i = 0; i < this.router.length; i++) {
            ret += this.tts(i);
        }
        return ret;
    }

    draw() {
        this.g.selectAll("rect").data([null]).enter().append("rect");
        this.g.select("rect")
            .attr("width", 40)
            .attr("height", 40)
            .attr("fill", Package.color(this.id % 20))
            .attr("stroke-width", 1)
            .attr("stroke", "#000")
        return this;
    }
}

class LogPackage {
    constructor(arg) {
        this.id = arg.id;//Número do pacote
        this.nf = arg.nf;//tamanho da fila
        this.ic = arg.ic;//intervalo de chegada
        this.ts = arg.ts;//tempo de serviço
        this.tcf = arg.tcf;//tempo de chegada na fila
        this.tis = arg.tis;//tempo de inicio de serviço
        this.tfs = arg.tfs;//tempo de fim de serviço
        this.is = arg.is;// intervalo de saída

        return this;
    }
}

class Queue {
    static counter = 0;
    constructor(m, g_element) {//mi em pps
        this.id = Queue.counter++;

        //Container gráfico
        this.g = g_element.classed("queue", true)
            .classed(`queue-${this.id}`, true);

        //Parametros de processamento da fila
        this.m = m * time_turn;//mi em turnos
        this.tms_turn = this.m ? 1 / this.m : -1;//tms em turnos -1 infinito

        //Lista de pacotes na fila
        this.pack_queue = [];
        //Pacote no servidor
        this.server_pack = null;

        //Passagem de pacotes no sistema
        this.log = [];

        if (this.m <= 0) {
            alert(`A fila ${this.id} possui taxa de serviço inválida. Insira um valor de μ maior que 0.`)
        }

        this.statistics = {
            ic: new EDP(),
            ts: new EDP(),
            tef: new EDP(),
            tts: new EDP(),
            nf: new EDP(),
            is: new EDP(),
            U: new EDP()
        };
        this.statistics.tps = this.statistics.ts;

        this.turned = -1;

        return this;
    }
    get queue() {
        var q = this.pack_queue.map(function (d, i) {
            d.queue_ord = i;
            return d;
        });

        return q.sort(function (d1, d2) {
            return d1.id > d2.id ? 1 : (d1.id < d2.id ? -1 : 0)
        });
    }
    turn(time, next) { // gerencia a movimentação dos pacotes dentro do sistema de fila

        if (next) {
            next.g.classed(`p-queue-${this.id}`, true);
            this.pack_queue.push(next);//entra na fila
            next.nf.push(this.pack_queue.length - 1);//Salva quantos pacotes tinha na fila quando o pacote chegou;

            this.statistics.nf.insert(this.pack_queue.length - 1);
            if (this.log.length)
                this.statistics.ic.insert(time - this.log[this.log.length - 1].tcf);
        }
        if (this.m && (!this.server_pack || time >= this.server_pack.timeoutserver)) {
            var ret = this.server_pack;
            this.server_pack = null;

            if (this.pack_queue.length != 0) {// Fila não vazia, 
                this.server_pack = this.pack_queue[0];//pega o primeiro da fila
                this.pack_queue = this.pack_queue.slice(1);//atualiza a fila

                //Calcula a duração do pacote no servidor
                var ts = this.tms_turn == -1 ? -1 : Math.ceil(X(this.tms_turn));
                this.server_pack.duration.push(ts);
                //Marca o tempo de entrada
                this.server_pack.router.push(time);

                //tempo de serviço
                this.statistics.ts.insert(ts);
                //Tempo de espera na fila
                this.statistics.tef.insert(this.server_pack.tef())
                //Tempo Total no Sistema
                this.statistics.tts.insert(this.server_pack.tts())

                //Comportamentos gráficos
                this.server_pack.g.classed(`p-queue-${this.id}`, false);
                this.server_pack.g.classed(`server-${this.id}`, true);
            }
            if (ret) {
                //Intervalo entre saídas
                if (this.log.length)
                    this.statistics.is.insert(time - this.log[this.log.length - 1].tfs);
                //Logs do sistema de fila
                this.log.push({
                    id: ret.id,
                    nf: ret.getNf(),
                    ic: (ret.r - 1 ? ret.router[ret.r - 2] + ret.duration[ret.r - 2] : ret.start)
                        - (this.log.length ? this.log[this.log.length - 1].tcf : 0),
                    ts: ret.duration[ret.r - 1],
                    tcf: ret.r - 1 ? ret.router[ret.r - 2] + ret.duration[ret.r - 2] : ret.start,
                    tis: ret.router[ret.r - 1],
                    tfs: time,
                    is: time - (this.log.length ? this.log[this.log.length - 1].tfs : 0)
                })


                //Comportamento Gráfico
                ret.g.classed(`server-${this.id}`, false);
            }

            if (time > this.turned) {
                this.statistics.U.insert(this.server_pack == null ? 0 : 1);
            }

            this.turned = time;

            return ret;
        }

        if (time > this.turned) {
            this.statistics.U.insert(this.server_pack == null ? 0 : 1);
        }

        this.turned = time;

        return null;
    }
    busy() {
        return this.pack_queue.length > 0 || this.server_pack != null;
    }
    draw() {
        this.g.selectAll("circle").data([null]).enter().append("circle")
            .attr("fill", "#218838")
            .attr("stroke", "#333")
            .attr("stroke-width", 3);
        this.g.select("circle").attr("r", 33).attr("cy", 30).attr("cx", 120);

        this.g.selectAll("path").data([null]).enter().append("path");
        this.g.select("path").attr("d", "M 0 0 L 90 0 90 60 0 60 0 55 85 55 85 5 0 5 z")
            .attr("fill", "#333");
        return this;
    }
    get μ() {
        return this.m / time_turn;
    }
    get tms() {
        return 1 / this.μ;
    }
    get T() {
        var last = this.log[this.log.length - 1];
        var first = this.log[0];
        return (last.tfs - first.tcf) * time_turn;
    }
    get N() {
        return this.log.length;
    }
    get U() {
        return this.statistics.U.μ;
    }
    get p0() {
        return 1 - this.statistics.U.μ;
    }
    E(v) {
        if (v == "nf" || v == "U")
            return this.statistics[v].E
        return this.statistics[v].E * time_turn
    }
    σ(v) {
        if (v == "nf" || v == "U")
            return this.statistics[v].σ
        return this.statistics[v].σ * time_turn
    }
}

class NetQueue {
    static counter = 0;
    constructor(l, m, r, g_element) {
        this.id = NetQueue.counter++;

        this.scale_transform = "";

        //Container gráfico
        if (typeof g_element == "string")
            this.g = d3.select(g_element);
        else
            this.g = g_element;

        this.g.attr("class", `net-queue net-queue-${this.id}`);

        //Parâmetros de entrada de pacotes
        this.l = l * time_turn;//lambda em turnos
        this.imc_turn = this.l ? 1 / this.l : -1; // -1 infinito
        this.n = 0; // Numero de pacotes que passaram pelo sistema
        this.m = m;

        //Roteamento
        this.r = r;

        //Criação dos Sistemas de fila
        var queues_d3 = this.g.append("g").classed("queues", true);
        this.g.append("g").classed("packages", true);

        this.queues = [];
        for (var i = 0; i < m.length; i++) {
            this.queues.push(new Queue(m[i], queues_d3.append("g")));
        }

        // Posicionamento dos sistemas de Fila na rede
        this.queues[r[0]].x_index = 0;
        this.queues[r[0]].y_index = 0;
        var x_index = [1];
        this.n_row = 1;
        for (var i = 1; i < r.length; i++) {
            if (this.queues[r[i]].x_index == undefined) {
                this.queues[r[i]].x_index = this.queues[r[i - 1]].x_index + 1;
                if (!x_index[this.queues[r[i]].x_index]) {
                    x_index[this.queues[r[i]].x_index] = 1;
                } else {
                    x_index[this.queues[r[i]].x_index]++;
                }
                this.queues[r[i]].y_index = x_index[this.queues[r[i]].x_index] - 1;
                this.n_row = this.queues[r[i]].y_index + 1 < this.n_row ? this.n_row : this.queues[r[i]].y_index + 1;
            }
        }
        this.n_col = x_index.length;


        this.out = null;

        this.input = this.g.append("g").classed("input", true);
        this.output = this.g.append("g").classed("output", true);

        this.time = 0;
        this.create_next = 0;
        this.closed = false;

        if (this.l <= 0) {
            alert("Este sistema de fila possui entrada inválida. Insira um valor de λ maior que 0.")
        }

        if (this.r.length) {
            for (var i = 0; i < this.r.length; i++) {
                if (r[i] >= this.queues.length)
                    alert(`O vetor de rotas na posição ${i} indica uma fila que não existe [${r[i]}]. Insira um valor entre 0 e ${this.queues.length - 1}.`);
            }
        } else {
            alert(`O vetor de rotas está vazio. Insira valores entre 0 e ${this.queues.length - 1} para construir o caminho no sistema de filas.`);
        }


        return this;
    }
    get nqueue() {
        return this.queues.length;
    }
    get λ() {
        return this.l / time_turn;
    }
    get imc() {
        return 1 / this.λ
    }
    get router() {
        return this.r.map(function (d, i, r) {
            return `${d}-${r[i + 1]}`
        }).slice(0, this.r.length - 1).join("; ");
    }
    busy() {
        var ret = false;

        if (this.next || this.out)
            return true;

        for (var i = 0; i < this.queues.length; i++) {
            ret = ret || this.queues[i].busy();
        }

        return ret;
    }
    close() {
        this.closed = true;
    }
    turn() { // Gerencia a entrada e saída de pacotes de cada sistema de fila
        for (var i = this.queues.length - 1; i >= 0; i--) {
            this.next = this.queues[i].turn(this.time);
            while (this.next) {
                if (this.next.r < this.r.length)
                    this.next.g.classed(`out-${this.next.r - 1}`, true),
                        this.next = this.queues[this.r[this.next.r]].turn(this.time, this.next);
                else
                    this.out = this.next, this.next = null,
                        this.out.g.classed("pack-end", true);
            }
        }

        if (!this.closed && this.l && this.time >= this.create_next) {
            this.next = new Package(this.time, this.g.select(".packages").append("g")).draw();
            this.next.n = this.n++;
            this.next.g.classed("pack-start", true);

            this.queues[this.r[0]].turn(this.time, this.next);

            this.create_next = this.imc_turn == -1 ? -1 : this.time + Math.ceil(X(this.imc_turn));
        }

        this.time++;

        return this;
    }
    console() {
        console.log(`Time: ${this.time} Nº Packages: ${this.n}`)
        for (var i = 0; i < this.queues.length; i++) {
            var q = "";
            for (var j = 0; j < this.queues[i].pack_queue.length; j++) {
                q += ` ${this.queues[i].pack_queue[j].n}`;
            }
            console.log(`\t(${this.queues[i].server_pack ? (this.queues[i].server_pack.n < 10 ? " " : "") + this.queues[i].server_pack.n : " N"})|${q} |`);
        }
        return this;
    }
    draw() {
        var horizontal_padding = 80,
            vertical_padding = 80,
            vertical_out = vertical_padding + (vertical_padding + 60) * this.n_row;

        var transition_out = 0.25,
            transition_step1 = 0.15,
            transition_step2 = 0.2,
            transition_step3 = 0.15,
            transition_in = 0.25;

        //Redimensionando sistema
        var info = {
            w: 100 + horizontal_padding + this.n_col * (150 + horizontal_padding),
            h: vertical_out + 150
        };
        var s = 1200 / info.w;
        s = s > 600 / info.h ? 600 / info.h : s;
        this.scale_transform = `scale(${s},${s})`

        // Start Draw Net Queue
        this.input.selectAll("path").data(["M 50 0 L 75 25 75 75 50 100 0 50 z",
            "M 75 25 L 75 75 100 50"])
            .enter().append("path").attr("class", function (d, i) { return i ? "door" : "base" })
            .attr("d", function (d) { return d })
            .attr("fill", "#0069d9")
            .attr("stroke","#0069d9")
            .attr("stroke-width",1);
        this.input.selectAll("text").data([null]).enter().append("text")
            .attr("text-anchor", "middle")
            .attr("x", 50).text("IN")
            .attr("y", 50).attr("fill", "white").attr("font-size", 23)
            .attr("dy", "0.4em");

        this.output.selectAll("path").data(["M 50 0 L 75 25 75 75 50 100 0 50 z",
            "M 75 25 L 75 75 100 50"])
            .enter().append("path").attr("class", function (d, i) { return i ? "door" : "base" })
            .attr("d", function (d) { return d })
            .attr("fill", "#0069d9")
            .attr("stroke","#0069d9")
            .attr("stroke-width",1);
        this.output.selectAll("text").data([null]).enter().append("text")
            .attr("text-anchor", "middle")
            .attr("x", 50).text("OUT")
            .attr("y", 50).attr("fill", "white").attr("font-size", 23)
            .attr("dy", "0.4em");

        this.input.attr("transform", `translate(0,${vertical_padding - 20})`)
        this.output.attr("transform", `translate(0,${vertical_out - 20})`);

        // New Package
        var p_next = this.g.select(".pack-start");
        if (!p_next.empty()) {
            p_next
                .attr("transform", `translate(25,${vertical_padding + 10})`);

            this.input.select(".door").transition()
                .duration(transition_duration * transition_out)
                .attr("d", "M 75 25 L 125 25 100 0");

            var x_package = 100 + horizontal_padding - 60;

            p_next.transition().delay(transition_duration * transition_in)
                .duration(transition_duration * (transition_step1 + transition_step2 + transition_step3))
                .attr("transform", `translate(${x_package},${vertical_padding + 10})`);

            p_next.classed("pack-start", false);

            this.input.select(".door").transition()
                .delay(transition_duration * (transition_in + transition_step1))
                .duration(transition_duration * transition_step2)
                .attr("d", "M 75 25 L 75 75 100 50");
        }

        // Out Packages
        for (var i = 0; i < this.r.length - 1; i++) {
            var out_p = this.g.select(`.out-${i}`)
            if (!out_p.empty()) {
                out_p.classed(`out-${i}`, false);

                var last = {
                    x: 100 + horizontal_padding + this.queues[this.r[i]].x_index *
                        (150 + horizontal_padding) + 160,
                    y: vertical_padding + this.queues[this.r[i]].y_index *
                        (vertical_padding + 60) + 10
                }

                var now = {
                    x: 100 + horizontal_padding + this.queues[this.r[i + 1]].x_index *
                        (150 + horizontal_padding) - 70,
                    y: vertical_padding + this.queues[this.r[i + 1]].y_index *
                        (vertical_padding + 60) + 10
                }
                this.queues[this.r[i]].g.select("circle").transition()
                    .duration(transition_duration * transition_in)
                    .attr("fill", "#218838");
                if (last.y == now.y && last.x == now.x) {
                    out_p.transition()
                        .duration(transition_duration * (transition_in + transition_step1 + transition_step2 + transition_step3))
                        .attr("transform", `translate(${last.x},${last.y})`);
                } else if (last.x == now.x) {
                    out_p.transition()
                        .duration(transition_duration * transition_in)
                        .attr("transform", `translate(${last.x},${last.y})`);

                    out_p.transition().delay(transition_duration * transition_in)
                        .duration(transition_duration * (transition_step1 + transition_step2 + transition_step3))
                        .attr("transform", `translate(${now.x},${now.y})`);
                } else {
                    out_p.transition()
                        .duration(transition_duration * transition_in)
                        .attr("transform", `translate(${last.x},${last.y})`);

                    out_p.transition().delay(transition_duration * transition_in)
                        .duration(transition_duration * (transition_step1))
                        .attr("transform", `translate(${last.x},${vertical_padding - 50})`);

                    out_p.transition().delay(transition_duration * (transition_in + transition_step1))
                        .duration(transition_duration * (transition_step2))
                        .attr("transform", `translate(${now.x},${vertical_padding - 50})`);

                    out_p.transition().delay(transition_duration * (transition_in + transition_step1 + transition_step2))
                        .duration(transition_duration * transition_step3)
                        .attr("transform", `translate(${now.x},${now.y})`);
                }
            }
        }

        //Out Net System
        var out_p = this.g.select(`.pack-end`)
        if (!out_p.empty()) {
            var last = {
                x: 100 + horizontal_padding + this.queues[this.r[this.r.length - 1]].x_index *
                    (150 + horizontal_padding) + 160,
                y: vertical_padding + this.queues[this.r[this.r.length - 1]].y_index *
                    (vertical_padding + 60) + 10
            }

            out_p.classed(`pack-end`, false);

            out_p.transition()
                .duration(transition_duration * transition_in)
                .attr("transform", `translate(${last.x},${last.y})`);

            out_p.transition()
                .delay(transition_duration * transition_in)
                .duration(transition_duration * (transition_step1))
                .attr("transform", `translate(${last.x},${vertical_out + 10})`);

            out_p.transition()
                .delay(transition_duration * (transition_in + transition_step1))
                .duration(transition_duration * (transition_step2 + transition_step3))
                .attr("transform", `translate(${25},${vertical_out + 10})`).remove();

            this.output.select(".door").transition()
                .delay(transition_duration * (transition_in + transition_step1))
                .duration(transition_duration * transition_step2)
                .attr("d", "M 75 25 L 125 25 100 0");

            this.output.select(".door").transition()
                .delay(transition_duration * (transition_in + transition_step1 + transition_step2 + transition_step3))
                .duration(transition_duration * transition_in)
                .attr("d", "M 75 25 L 75 75 100 50");

            var a = this;
            setTimeout(() => { this.out = null; }, transition_duration + 10);

        }


        // Draw Queues
        for (var i = 0; i < this.queues.length; i++) {
            var x = 100 + horizontal_padding + this.queues[i].x_index * (150 + horizontal_padding);
            var y = vertical_padding + this.queues[i].y_index * (vertical_padding + 60);

            this.queues[i].draw().g.attr("transform", `translate(${x},${y})`)//.attr("filter","url(#shadow)");

            var x_axis = d3.scaleBand().domain(range(this.queues[i].pack_queue.length < 4 ? 4 : this.queues[i].pack_queue.length))
                .range([x + 80, x]).paddingInner(0.1),
                y_pack = y + 10,
                scale_x = x_axis.bandwidth() / 40;

            this.g.selectAll(`.p-queue-${this.queues[i].id}`).data(this.queues[i].queue).transition()
                .delay(transition_duration * (transition_in + transition_step1 + transition_step2 + transition_step3))
                .duration(transition_duration * transition_in)
                .attr("transform", function (d, i) { return `translate(${x_axis(d.queue_ord)},${y_pack})scale(${scale_x},1)` })

            var server = this.g.select(`.server-${this.queues[i].id}`).transition()
                .delay(transition_duration * (transition_out + transition_step1 + transition_step2 + transition_step3))
                .duration(transition_duration * transition_in)
                .attr("transform", `translate(${x + 100},${y_pack})scale(1,1)`);

            if (!server.empty())
                this.queues[i].g.select("circle").transition()
                    .delay(transition_duration * (transition_out + transition_step1 + transition_step2 + transition_step3))
                    .duration(transition_duration * transition_in)
                    .attr("fill", "#dc3545");

        }
        return this;
    }
}