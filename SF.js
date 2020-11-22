var time_turn = 0.001,
    transition_duration = 2000,
    state_duration = 1000,
    n_package = 50;


function X(p) {
    var u = (Math.random() + 1.0) / (3.0); // u in (0,1)
    return -p * Math.log(u);
}

class Package {
    static counter = 0;
    constructor(start,g_element) {
        this.id = Package.counter++;

        //Container gráfico
        this.g = g_element.classed("package",true)
                .classed(`package-${this.id}`,true);

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

    draw(){
        this.g.selectAll("rect").data([null]).enter().append("rect");
        this.g.select("rect").attr("width",40).attr("height",40).attr("fill","#3A3");
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
    constructor(m,g_element) {//mi em pps
        this.id = Queue.counter++;

        //Container gráfico
        this.g = g_element.classed("queue",true)
                .classed(`queue-${this.id}`,true);

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
            next.g.classed(`queue-${this.id}`,true);
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
                this.server_pack.g.classed(`queue-${this.id}`,false);
                this.server_pack.g.classed(`server-${this.id}`,true);
            }
            if(ret)
                ret.g.classed(`server-${this.id}`,false);
            return ret;
        }
        return null;
    }
    draw(){
        this.g.selectAll("circle").data([null]).enter().append("circle");
        this.g.select("circle").attr("r",30).attr("cy",30).attr("cx",120).attr("fill","#33A");

        this.g.selectAll("path").data([null]).enter().append("path");
        this.g.select("path").attr("d","M 0 0 L 90 0 90 60 0 60 0 55 85 55 85 5 0 5 z").attr("fill","#333");
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

        this.g.classed("netqueue",true).classed(`netqueue-${this.id}`,true);
        
        //Parâmetros de entrada de pacotes
        this.l = l * time_turn;//lambda em turnos
        this.imc = 1 / this.l;

        //Roteamento
        this.r = r;

        //Criação dos Sistemas de fila
        var queues_d3 = this.g.append("g").classed("queues",true);
        this.g.append("g").classed("packages",true);

        this.queues = [];
        for (var i = 0; i < m.length; i++) {
            this.queues.push(new Queue(m[i],queues_d3.append("g")));
            this.queues[i].draw();
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

        this.out = null;

        this.input = {};
        this.output = {};

        this.time = 0;
        this.create_next = 0;

        return this;
    }
    turn() { // Gerencia a entrada e saída de pacotes de cada sistema de fila
        for (var i = this.queues.length-1; i >=0; i--) {
            this.next = this.queues[i].turn(this.time);
            while (this.next) {
                if (this.next.r < this.r.length)
                    this.next.g.classed(`out-${this.next.r-1}`,true),
                    this.next = this.queues[this.r[this.next.r]].turn(this.time, this.next);
                else
                    this.out = this.next, this.next = null,
                    this.out.g.classed("pack-end",true);
            }
        }

        if (this.time >= this.create_next) {
            this.next = new Package(this.time,this.g.select(".packages").append("g")).draw();
            this.next.g.classed("pack-start",true);
            
            this.queues[this.r[0]].turn(this.time, this.next);

            this.create_next = this.time + Math.ceil(X(this.imc));
        }

        for (var i = 0; i < this.queues.length; i++) {
            var q = "";
            for(var j=0;j< this.queues[i].pack_queue.length;j++){
                q+= ` ${this.queues[i].pack_queue[j].id}`;
            }
            console.log(`(${this.queues[i].server_pack?this.queues[i].server_pack.id:"N"})|${q} |`);
        }

        this.time++;

        return this;
    }
}