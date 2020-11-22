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
function deep_copy (object) {
    return JSON.parse(JSON.stringify(object));
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

function X(p) {
    var u = (Math.random() + 1.0) / (3.0); // u in (0,1)
    return -p * Math.log(u);
}

class Package {
    static counter = 0;
    constructor(start, g_element) {
        this.id = Package.counter++;

        //Container gráfico
        this.g = g_element.classed("package", true)
            .classed(`package-${this.id}`, true);

        this.start = start;
        this.router = [];// time turn on server input
        this.duration = [];// time duration in server
        //this.update = false;

        return this;
    }
    get timeoutserver() {
        var i = this.router.length - 1;
        return this.router[i] + this.duration[i];
    }

    get r() {
        return this.router.length;
    }

    draw() {
        this.g.selectAll("rect").data([null]).enter().append("rect");
        this.g.select("rect").attr("width", 40).attr("height", 40).attr("fill", "#3A3");
        return this;
    }
}

class LogPackage {
    constructor(nf, ic, ts, tcf, tis, tfs, is) {
        this.nf = nf;
        this.ic = ic;
        this.ts = ts;
        this.tcf = tcf;
        this.tis = tis;
        this.tfs = tfs;
        this.is = is;

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
        this.tms = 1 / this.m;//tms em turnos

        //Lista de pacotes na fila
        this.pack_queue = [];
        //Pacote no servidor
        this.server_pack = null;

        //Passagem de pacotes no sistema
        this.log = [];

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
        }
        if (!this.server_pack || time >= this.server_pack.timeoutserver) {
            var ret = this.server_pack;

            //this.server_pack.update = true;
            this.server_pack = null;
            if (this.pack_queue.length != 0) {// Fila não vazia, 
                this.server_pack = this.pack_queue[0];//pega o primeiro da fila
                this.pack_queue = this.pack_queue.slice(1);//atualiza a fila

                this.server_pack.router.push(time);//Marca o tempo de entrada
                this.server_pack.duration.push(Math.ceil(X(this.tms)));//Calcula a duração do 
                //pacote no servidor
                this.server_pack.g.classed(`p-queue-${this.id}`, false);
                this.server_pack.g.classed(`server-${this.id}`, true);
            }
            if (ret)
                ret.g.classed(`server-${this.id}`, false);
            return ret;
        }
        return null;
    }
    draw() {
        this.g.selectAll("circle").data([null]).enter().append("circle");
        this.g.select("circle").attr("r", 30).attr("cy", 30).attr("cx", 120).attr("fill", "#33A");

        this.g.selectAll("path").data([null]).enter().append("path");
        this.g.select("path").attr("d", "M 0 0 L 90 0 90 60 0 60 0 55 85 55 85 5 0 5 z").attr("fill", "#333");
        return this;
    }
}

class NetQueue {
    static counter = 0;
    constructor(l, m, r, g_element) {
        this.id = NetQueue.counter++;

        //Container gráfico
        if (typeof g_element == "string")
            this.g = d3.select(g_element);
        else
            this.g = g_element;

        this.g.classed("netqueue", true).classed(`netqueue-${this.id}`, true);

        //Parâmetros de entrada de pacotes
        this.l = l * time_turn;//lambda em turnos
        this.imc = 1 / this.l;
        this.n = 0; // Numero de pacotes que passaram pelo sistema

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
        for (var i = 1; i < r.length; i++) {
            if (this.queues[r[i]].x_index == undefined) {
                this.queues[r[i]].x_index = this.queues[r[i - 1]].x_index + 1;
                if (!x_index[this.queues[r[i]].x_index]) {
                    x_index[this.queues[r[i]].x_index] = 1;
                } else {
                    x_index[this.queues[r[i]].x_index]++;
                }
                this.queues[r[i]].y_index = x_index[this.queues[r[i]].x_index] - 1;
            }
        }
        this.n_col = x_index.length;

        this.out = null;

        this.input = this.g.append("g").classed("input", true);
        this.output = this.g.append("g").classed("output", true);

        this.time = 0;
        this.create_next = 0;

        return this;
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

        if (this.time >= this.create_next) {
            this.next = new Package(this.time, this.g.select(".packages").append("g")).draw();
            this.next.n = this.n++;
            this.next.g.classed("pack-start", true);

            this.queues[this.r[0]].turn(this.time, this.next);

            this.create_next = this.time + Math.ceil(X(this.imc));
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
            vertical_padding = 60;

        this.input.selectAll("path").data(["M 50 0 L 75 25 75 75 50 100 0 50 z",
            "M 75 25 L 75 75 100 50"])
            .enter().append("path").attr("class", function (d, i) { return i ? "door" : "base" })
            .attr("d", function (d) { return d });

        this.output.selectAll("path").data(["M 50 0 L 75 25 75 75 50 100 0 50 z",
            "M 75 25 L 75 75 100 50"])
            .enter().append("path").attr("class", function (d, i) { return i ? "door" : "base" })
            .attr("d", function (d) { return d });

        this.input.attr("transform", `translate(0,${vertical_padding - 20})`)
        this.output.attr("transform", `translate(0,${2 * vertical_padding + 60 - 20})`)

        for (var i = 0; i < this.queues.length; i++) {
            var x = 100 + horizontal_padding + this.queues[i].x_index * (150 + horizontal_padding);
            var y = vertical_padding + this.queues[i].y_index * (vertical_padding + 60);

            this.queues[i].draw().g.attr("transform", `translate(${x},${y})`)//.attr("filter","url(#shadow)");

            var x_axis = d3.scaleBand().domain(range(this.queues[i].pack_queue.length<4?4:this.queues[i].pack_queue.length))
                .range([x+80,x]).paddingInner(0.1),
                y_pack = y+10,
                scale_x = x_axis.bandwidth()/40;

            this.g.selectAll(`.p-queue-${this.queues[i].id}`).data(this.queues[i].queue)
                .attr("transform", function (d, i) { return `translate(${x_axis(d.queue_ord)},${y_pack})scale(${scale_x},1)` })

            this.g.select(`.server-${this.queues[i].id}`).attr("transform",`translate(${x+100},${y_pack})scale(1,1)`);
        }
        return this;
    }
}